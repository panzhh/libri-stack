import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from flask_mail import Mail, Message
from models import db, User, Book, BorrowRecord, ContactMessage
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_apscheduler import APScheduler
from flask import request, jsonify
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask import send_from_directory

# Points to the .env file one directory up
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))

# Get the frontend URL from environment variables, fallback to localhost for development
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

app = Flask(__name__)
# CORS(app, origins=[
#     "http://localhost:5173", 
#     "https://libri-stack-fe-3d05e08a80a4.herokuapp.com",
#     "https://www.churchlibdl.org",
#     "https://churchlibdl.org"
# ])

CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-very-secret-fallback-key-for-local')

database_url = os.getenv('DATABASE_URL') or os.getenv('SQLALCHEMY_DATABASE_URI_LOCAL')

if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

# MAIL SERVER CONFIG (Required for Email Verification)
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = (
    "Church in Dunn Loring Library",
    os.getenv("MAIL_DEFAULT_SENDER"),
)


db.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return {
        "message": "Library API is active",
        "status": "success",
        "version": "1.0.0"
    }, 200



@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email').strip().lower()
    user = User.query.filter_by(email=email).first()
    
    # We return 200 even if user doesn't exist for security (prevents "email fishing")
    if user:
        # Generate a token valid for 1 hour (reuse your existing itsdangerous/jwt logic)
        token = serializer.dumps(email, salt="password-reset")
        
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password/{token}"
        
        msg = Message(
            "Reset Your Church In Dunn Loring Library Password",
            sender=app.config["MAIL_USERNAME"],
            recipients=[email],
        )
        msg.body = f"Click the following link to reset your password: {reset_link}\n\nIf you didn't request this, ignore this email."
        mail.send(msg)
        
    return jsonify({"message": "If an account exists, a reset link has been sent"}), 200



@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    try:
        # We check the salt and the max_age (1 hour)
        email = serializer.loads(token, salt="password-reset", max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "The reset link has expired."}), 400
    except BadSignature:
        return jsonify({"error": "Invalid reset link."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User no longer exists."}), 404

    # Update and hash the new password
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully!"}), 200



@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    full_name = data.get("full_name")
    email = data.get("email").strip().lower()
    passwd = data.get("password")

    role = data.get("role", "user")
    provided_code = data.get("adminCode")
    try:
        if User.query.filter_by(email=email).first():
            return jsonify({"msg": "Email already registered"}), 400

        inviter_email = None

        # --- SECURE ADMIN LOGIC (ROOT1 works only for the very first Admin) ---
        if role == "admin":
            first_admin = User.query.filter_by(role="admin").first()
            if not first_admin:
                if provided_code == "ROOT1":
                    inviter_email = "SYSTEM_ROOT"
                else:
                    return (
                        jsonify({"msg": "System setup required. Enter Master Code."}),
                        403,
                    )
            else:
                # ROOT1 is now inactive; must use an existing admin's 5-digit code
                inviter = User.query.filter_by(own_invite_code=provided_code).first()
                if not inviter:
                    return jsonify({"msg": "Invalid or expired Invite Code"}), 403
                inviter_email = inviter.email

        new_user = User(
            full_name=full_name,
            email=email,
            phone=data.get("phone"),
            role=role,
            registration_date=datetime.now(timezone.utc),
            invited_by=inviter_email,
            is_verified=False,
        )
        new_user.set_password(passwd)

        if role == "admin":
            new_user.own_invite_code = User.generate_unique_code()

        db.session.add(new_user)

        # --- EMAIL VERIFICATION LOGIC ---
        token = serializer.dumps(email, salt="email-confirm")
        verify_url = f"{FRONTEND_URL}/verify/{token}?role={role}"

        msg = Message(
            "Verify Your Account",
            sender=app.config["MAIL_USERNAME"],
            recipients=[email],
        )
        msg.body = f"Click here to verify in 1 hour: {verify_url}"
        mail.send(msg)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback() # Crucial! Postgres requires a rollback after a fail
            print(f"COMMIT FAILED: {e}")
            return jsonify({"error": str(e)}), 500
        return (
            jsonify(
                {
                    "message": "Registration Successful. A verification link has been sent to your email address. Please click the link within 15 minutes to activate your account."
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/verify/<token>", methods=["POST"])
def verify_email(token):
    role = request.args.get("role")  # Get 'owner' or 'courier' from URL
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "User not found"}), 404
        if role != user.role:
            return jsonify({"msg": "Verification failed: Role mismatch"}), 403

        user.is_verified = True
        db.session.commit()
        return jsonify({"msg": "Email verified successfully!"}), 200
    except (SignatureExpired, BadTimeSignature):
        return jsonify({"msg": "The link is invalid or has expired"}), 400


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email").strip().lower()
    password = data.get("password")  # The plain text from the form
    role = data.get("role")  # The role from the form

    user = User.query.filter_by(email=email).first()

    # user.check_password handles the complex math of comparing hashes
    if user and user.check_password(password):
        if not user.is_verified:
            # resend the verify email 
            token = serializer.dumps(email, salt="email-confirm")
            verify_url = f"{FRONTEND_URL}/verify/{token}?role={role}"

            msg = Message(
                "Verify Your Account",
                sender=app.config["MAIL_USERNAME"],
                recipients=[email],
            )
            msg.body = f"Click here to verify in 1 hour: {verify_url}"
            mail.send(msg)
            return jsonify({"msg": "You have not verified your email yet. Verify email resend, Please verify your email first"}), 401

        if role != user.role:
            return jsonify({"msg": f"Your are trying to login in as {role}, but you input Invalid email or password."}), 401

        access_token = create_access_token(
            identity=str(user.id)
        ) 

        return (
            jsonify(
                {
                    "token": access_token,
                    "role": user.role,
                    "full_name": user.full_name,
                    "email": user.email,
                    "id": str(user.id),
                }
            ),
            200,
        )

    return jsonify({"msg": "Invalid email or password"}), 401


# --- 4. BOOKS API (Paginated for 5,000 entries) ---
@app.route("/api/books", methods=["GET"])
def get_books():
    all_books = Book.query.all()
    return jsonify([book.to_dict() for book in all_books])


@app.route("/api/debug/users", methods=["GET"])
def get_all_users():
    # Optional filter: /api/debug/users?role=admin
    role_filter = request.args.get("role")

    if role_filter:
        users = User.query.filter_by(role=role_filter).all()
    else:
        users = User.query.all()

    # Use the to_dict() method we added to models.py earlier
    return jsonify([user.to_dict() for user in users]), 200


@app.route("/api/debug/delete-user", methods=["DELETE"])
@jwt_required() # Assuming you use JWT for the admin session
def delete_user():
    
    # Get the identity of the person making the request
    current_admin_email = get_jwt_identity() 

    if email == current_admin_email:
        return jsonify({"error": "Self-destruction blocked! You cannot delete your own admin account."}), 400

    user = User.query.filter_by(email=email).first()
    # We use query parameters for ease of use in tools like Postman or Curl
    email = request.args.get("email")

    if not email:
        return jsonify({"msg": "Email parameter is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"msg": f"User {email} not found"}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"msg": f"User {email} deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error deleting user", "error": str(e)}), 500


def seed_database():
    with app.app_context():
        if Book.query.count() == 0:
            print("🚀 Database empty. Seeding from books.json...")
            try:
                # Get the directory where the script is located
                base_dir = os.path.dirname(os.path.abspath(__file__))
                json_path = os.path.join(base_dir, 'books.json')
                with open(json_path, "r", encoding="utf-8") as f:
                    books_data = json.load(f)
                    for item in books_data:
                        book_args = {k: v for k, v in item.items() if hasattr(Book, k)}

                        raw_copies = item.get("copies")
                        num_copies = int(raw_copies) if raw_copies is not None else 0

                        book_args["copies"] = num_copies
                        book_args["availableCopies"] = num_copies

                        new_book = Book(**book_args)
                        db.session.add(new_book)

                    db.session.commit()
                    print(f"✅ Success! {len(books_data)} books imported.")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error during seeding: {e}")
        else:
            print("📚 Database already has data. Skipping seed.")


@app.route("/api/borrow/<int:book_id>", methods=["POST"])
@jwt_required()  # This checks if the token is valid and hasn't expired
def borrow_book_by_id(book_id):
    user_id = get_jwt_identity()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # if user.role == "admin":
    #     return (
    #         jsonify(
    #             {
    #                 "error": "Access Denied. Administrative accounts are not permitted to borrow books. Please use a Member account.",
    #                 "message": "Administrative accounts are not permitted to borrow books. Please use a Member account.",
    #             }
    #         ),
    #         403,
    #     )
    # # -------------------------

    active_borrows_count = BorrowRecord.query.filter_by(
        user_id=user_id, status="borrowed"
    ).count()

    if active_borrows_count >= 5:
        return (
            jsonify(
                {
                    "error": "Borrowing limit reached.",
                    "message": "You can only have 5 active borrows at a time. Please return a book first.",
                }
            ),
            403,
        )  # 403 Forbidden is the correct status code here

    already_has_book = BorrowRecord.query.filter_by(
        user_id=user_id, book_id=book_id, status="borrowed"
    ).first()

    if already_has_book:
        return (
            jsonify(
                {
                    "error": "Already Borrowed, Please don't borrow it again.",
                    "message": "You already have a copy of this book in your library!",
                }
            ),
            400,
        )  # 400 Bad Request

    data = request.get_json()

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    book = Book.query.get_or_404(book_id)

    if book.availableCopies <= 0:
        return jsonify({"error": "No copies available"}), 400

    current_time = datetime.now(timezone.utc)
    # Defaulting to a 30-day borrow period
    calculated_due_date = current_time + timedelta(days=30)

    # Create the record with the required dates
    new_record = BorrowRecord(
        user_id=user_id,
        book_id=book_id,
        borrow_date=current_time,  # Added this
        due_date=calculated_due_date,  # Added this (fixes the error)
        status="borrowed",
    )

    book.availableCopies -= 1

    try:
        db.session.add(new_record)
        db.session.commit()
        return jsonify(book.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Route to fetch books currently borrowed by a specific user
@app.route("/api/users/<int:user_id>/borrowed-books", methods=["GET"])
def get_borrowed_books(user_id):
    # Join the BorrowRecord with the Book table to get the titles/images
    records = (
        db.session.query(Book, BorrowRecord)
        .join(BorrowRecord, Book.id == BorrowRecord.book_id)
        .filter(BorrowRecord.user_id == user_id)
        .all()
    )

    results = []
    for book, record in records:
        book_data = book.to_dict()
        book_data["borrow_record_id"] = record.id  # Need this to return it later
        results.append(book_data)

    return jsonify(results), 200


from flask_jwt_extended import jwt_required, get_jwt_identity


@app.route("/api/return/<int:record_id>", methods=["POST"])
@jwt_required()
def return_book(record_id):
    user_id = int(get_jwt_identity())

    record = BorrowRecord.query.filter_by(
        id=record_id, user_id=user_id, status="borrowed"
    ).first_or_404()

    book = db.session.get(Book, record.book_id)

    try:
        # Update the record status
        record.status = "returned"
        record.return_date = datetime.now(timezone.utc)  # This saves the date!
        # Increase the library stock
        book.availableCopies += 1

        db.session.commit()
        return jsonify({"message": "Success! Book returned."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route("/api/user/borrowed-books", methods=["GET"])
@jwt_required()
def get_my_borrowed_books():
    user_id = int(get_jwt_identity())

    records = (
        db.session.query(Book, BorrowRecord)
        .join(BorrowRecord, Book.id == BorrowRecord.book_id)
        .filter(BorrowRecord.user_id == user_id, BorrowRecord.status == "borrowed")
        .all()
    )

    results = []
    for book, record in records:
        results.append(
            {
                "record_id": record.id,
                "book_id": book.id,
                "title": book.title,
                "author": book.author,
                "borrow_date": record.borrow_date.strftime("%Y-%m-%d"),
                "due_date": record.due_date.strftime("%Y-%m-%d"),
                "uploadedImageUrl": book.uploadedImageUrl,
                "status": record.status,
                "series": book.series,
                "volume": book.volume,
                "publisher": book.publisher,
                "genre": book.genre,
                "language": book.language,
                "isbn": book.isbn,
                "numberOfPages": book.numberOfPages,
                "listPrice": book.listPriceUsd, 
                "summary": book.summary,
            }
        )

    return jsonify(results), 200


@app.route("/api/user/stats", methods=["GET"])
@jwt_required()
def get_user_stats():
    user_id = get_jwt_identity()

    # Count only books that haven't been returned yet
    active_count = BorrowRecord.query.filter_by(
        user_id=user_id, status="borrowed"
    ).count()

    # Count total books ever read for the 'Collection' stat
    total_read = BorrowRecord.query.filter_by(
        user_id=user_id, status="returned"
    ).count()

    return jsonify({"active": active_count, "total": total_read}), 200


@app.route("/api/user/history", methods=["GET"])
@jwt_required()
def get_borrow_history():
    user_id = int(get_jwt_identity())

    # Query records that have been returned
    records = (
        db.session.query(Book, BorrowRecord)
        .join(BorrowRecord, Book.id == BorrowRecord.book_id)
        .filter(BorrowRecord.user_id == user_id, BorrowRecord.status == "returned")
        .order_by(BorrowRecord.return_date.desc())  # Newest first
        .all()
    )

    print("history books: ", records)

    results = []
    for book, record in records:
        results.append(
            {
                "title": book.title,
                "author": book.author,
                "borrow_date": record.borrow_date.strftime("%Y-%m-%d"),
                "return_date": (
                    record.return_date.strftime("%Y-%m-%d")
                    if record.return_date
                    else "N/A"
                ),
            }
        )

    return jsonify(results), 200


scheduler = APScheduler()


def check_overdue_tasks():
    with app.app_context():
        # 1. Find books that are past due and not yet returned
        print("Running overdue check...")
        now = datetime.now(timezone.utc)
        overdue_list = BorrowRecord.query.filter(
            BorrowRecord.due_date < now,
            BorrowRecord.status == "borrowed",
        ).all()

        for record in overdue_list:
            # 3. Send reminder email
            # Assuming you have a User relationship or can query user by ID
            send_reminder_email(record.user_id, record.book.title)

        db.session.commit()
        print(f"Scan complete: {len(overdue_list)} books marked as overdue.")


def send_reminder_email(user_id, book_title):
    user = User.query.get(user_id)
    if user:
        msg = Message(
            subject="Action Required: Overdue Book",
            recipients=[user.email],
            body=f"Hi {user.full_name  }, the book '{book_title}' is past its due date. Please return it soon!",
        )
        mail.send(msg)


@app.route("/api/renew/<int:record_id>", methods=["POST"])
@jwt_required()
def renew_book(record_id):
    user_id = int(get_jwt_identity())

    record = BorrowRecord.query.filter_by(
        id=record_id, user_id=user_id, status="borrowed"
    ).first_or_404()

    # CHECK: Can only renew once
    if record.renewed:
        return (
            jsonify(
                {
                    "error": "Already Renewed",
                    "message": "This book has already been renewed once. Please return it by the due date.",
                }
            ),
            400,
        )

    try:
        # Extend the due date by 30 days from the CURRENT due date
        record.due_date = record.due_date + timedelta(days=30)
        record.renewed = True  # Mark as renewed

        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Success! Due date extended by 30 days.",
                    "new_due_date": record.due_date.strftime("%Y-%m-%d"),
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# --- ADDED: USER PROFILE ROUTE ---
@app.route("/api/users/profile", methods=["GET"])
@jwt_required()
def get_admin_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"msg": "User not found"}), 404

        return (
            jsonify(
                {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "is_verified": user.is_verified,
                    "registration_date": user.registration_date,
                    "invited_by": user.invited_by,
                    "own_invite_code": user.own_invite_code,  # This is the key field for your Admin Profile
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

import os
from flask import request, jsonify

# Ensure this path is correct relative to where you run the script
# Create the folder automatically if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'public', 'covers')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route("/api/books/<int:id>", methods=["PUT"])
def update_book(id):
    book = db.session.get(Book, id)

    if not book:
        return jsonify({"error": "Book not found"}), 404

    data = request.form 
    
    if 'coverImage' in request.files:
        file = request.files['coverImage']
        if file.filename != '':
            # We force the name to be [id].png as you requested
            # Note: You can keep .jpg if you prefer, just be consistent
            filename = f"{id}.png" 
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            
            # This saves the file and overwrites if it already exists
            file.save(file_path)
            
            book.uploadedImageUrl = f"/covers/{filename}"

    try:
        title = data.get("title")
        if title:
            book.title = title.strip()

        if "listPriceUsd" in data:
            try:
                # request.form values are always strings, so we convert to float
                price = float(str(data.get("listPriceUsd")).replace("$", "").strip())
                if price <= 0:
                    return jsonify({"error": "Price must be a positive number"}), 400
                book.listPriceUsd = price
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid price format"}), 400

        # --- UPDATE REMAINING FIELDS ---
        # Note: we use data.get("field", book.field) to keep old value if not provided
        book.author = data.get("author", book.author)
        book.series = data.get("series", book.series)
        book.volume = data.get("volume", book.volume)
        book.publisher = data.get("publisher", book.publisher)
        book.genre = data.get("genre", book.genre)
        book.language = data.get("language", book.language)
        book.isbn = data.get("isbn", book.isbn)
        book.summary = data.get("summary", book.summary)
        book.uploadedImageUrl = str(id)
        db.session.commit()
        return jsonify({"message": "Book updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500




@app.route('/api/covers/<path:filename>')
def serve_covers(filename):
    return send_from_directory('public/covers', filename)

# --- NEW: ROUTE FOR ADMIN BULK EMAIL ---
@app.route("/api/admin/send-email", methods=["POST"])
@jwt_required()
def admin_bulk_email():
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)

    if not admin or admin.role != "admin":
        return jsonify({"error": "Unauthorized. Admin access required."}), 403

    data = request.get_json()
    recipients = data.get("recipients")  # Expected: list of strings
    subject = data.get("subject")
    message_body = data.get("message")

    if not recipients or not subject or not message_body:
        return jsonify({"error": "Recipients, subject, and message are required."}), 400

    if not isinstance(recipients, list):
        return jsonify({"error": "Recipients must be a list of email addresses."}), 400

    try:
        msg = Message(
            subject=subject,
            sender=app.config["MAIL_USERNAME"],
            bcc=recipients,  # Using BCC for privacy
            body=message_body,
        )

        mail.send(msg)
        return (
            jsonify({"message": f"Successfully sent to {len(recipients)} users."}),
            200,
        )

    except Exception as e:
        print(f"Mail Server Error: {e}")
        return (
            jsonify(
                {
                    "error": "Failed to send email through SMTP server.",
                    "details": str(e),
                }
            ),
            500,
        )


@app.route('/api/admin/borrow-records', methods=['GET'])
def get_all_borrow_records():
    records = db.session.query(BorrowRecord, User, Book).join(
        User, BorrowRecord.user_id == User.id
    ).join(
        Book, BorrowRecord.book_id == Book.id
    ).all()

    output = []
    for record, user, book in records:
        output.append({
            "id": record.id,
            "user_name": user.full_name,
            "book_title": book.title,
            "book_id": book.id,
            "borrow_date": record.borrow_date.strftime('%Y-%m-%d'),
            "due_date": record.due_date.strftime('%Y-%m-%d'),
            "status": record.status
        })
    return jsonify(output)

    

@app.route('/api/admin/return-book/<int:record_id>', methods=['PATCH'])
def return_book_by_admin(record_id):
    record = BorrowRecord.query.get_or_404(record_id)
    
    if record.status == "returned":
        return jsonify({"message": "Book already returned"}), 400

    record.status = "returned"
    record.return_date = datetime.now(timezone.utc)
    
    book = Book.query.get(record.book_id)
    if book:
        book.availableCopies += 1

    try:
        db.session.commit()
        return jsonify({"message": "Book returned successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/add-book', methods=['POST'])
def add_new_book():
    data = request.get_json()
    new_entry = Book(
        title=data.get('title'),
        listPriceUsd=data.get('listPriceUsd'), 
        listPrice=data.get('listPriceUsd'),   
        copies=data.get('copies'),
        availableCopies=data.get('copies')
    )
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Saved"}), 201


@app.route('/api/admin/delete-book/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    active_loans = BorrowRecord.query.filter_by(book_id=book_id, status='borrowed').first()
    
    if active_loans:
        return jsonify({
            "error": "Cannot delete book. There are active loans currently out. Mark them as returned first."
        }), 400

    try:
        db.session.delete(book)
        db.session.commit()
        return jsonify({"message": f"Book '{book.title}' deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
    

@app.route('/api/admin/promote-user/<int:user_id>', methods=['PATCH'])
def promote_user(user_id):
    user = User.query.get_or_404(user_id)
    
    try:
        user.role = "admin"
        user.own_invite_code = User.generate_unique_code()
        db.session.commit()
        return jsonify({"message": "User promoted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/contact_messages', methods=['GET'])
def get_messages():
    # Only admins should see this (add your @admin_required decorator here)
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([m.to_dict() for m in messages])

@app.route('/api/admin/delete-message/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    msg = ContactMessage.query.get_or_404(msg_id)
    db.session.delete(msg)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@app.route('/api/contact', methods=['POST'])
def save_message():
    data = request.get_json()
    
    new_msg = ContactMessage(
        name=data.get('name'),
        email=data.get('email'),
        message=data.get('message')
    )
    
    db.session.add(new_msg) 
    db.session.commit()     
    
    return jsonify({"status": "success", "message": "Saved to database!"}), 201


@app.route('/api/contact', methods=['POST'])
def receive_contact():
    data = request.get_json()
    
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    # Backend Validation
    if not name or not email or not message:
        return jsonify({"error": "All fields are required"}), 400

    try:
        new_msg = ContactMessage(name=name, email=email, message=message)
        db.session.add(new_msg)
        db.session.commit()
        return jsonify({"message": "Message received successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to save message"}), 500


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_database()

    scheduler.init_app(app)
    scheduler.add_job(
        id="overdue_check", func=check_overdue_tasks, trigger="interval", days=1
    )

    scheduler.start()
    app.run(debug=True, port=5000)

    



import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from flask_mail import Mail, Message
from models import db, User, Book, BorrowRecord
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_apscheduler import APScheduler

# Points to the .env file one directory up
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "../.env"))


app = Flask(__name__)
CORS(app)

# --- 1. FULL CONFIGURATION ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    BASE_DIR, "libri.db"
)
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


# --- 2. INITIALIZATION ---
db.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config["JWT_SECRET_KEY"])

with app.app_context():
    db.create_all()

# --- 3. AUTHENTICATION & SECURITY ---


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    full_name = data.get("full_name")
    email = data.get("email")
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
            invited_by=inviter_email,
            is_verified=False,
        )
        new_user.set_password(passwd)

        if role == "admin":
            new_user.own_invite_code = User.generate_unique_code()

        db.session.add(new_user)

        # --- EMAIL VERIFICATION LOGIC ---
        token = serializer.dumps(data.get("email"), salt="email-confirm")
        # We add 'role' to the URL so the verify route knows which table to update!
        verify_url = f"http://localhost:5173/verify/{token}?role={role}"

        msg = Message(
            "Verify Your Account",
            sender=app.config["MAIL_USERNAME"],
            recipients=[data.get("email")],
        )
        msg.body = f"Click here to verify in 15 mins: {verify_url}"
        mail.send(msg)

        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Registration Successful > A verification link has been sent to your email address. Please click the link within 15 minutes to activate your account."
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
    print("role is: ", role)
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
    email = data.get("email")
    password = data.get("password")  # The plain text from the form
    role = data.get("role")  # The role from the form

    user = User.query.filter_by(email=email).first()
    print("data:", data)
    print("role:", role)
    print("user role:", user.role)

    # user.check_password handles the complex math of comparing hashes
    if user and user.check_password(password):
        print("come here")
        if not user.is_verified:
            print("come here2")
            return jsonify({"msg": "Please verify your email first"}), 401

        if role != user.role:
            print("come here3")
            return jsonify({"msg": "You input Invalid email or password"}), 401

        # access_token = create_access_token(identity={"id": user.id, "role": user.role})
        access_token = create_access_token(
            identity=str(user.id)
        )  # Explicitly convert to string

        print("come here4")
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
    # Returns all 5,000+ books as a JSON array
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
def delete_user():
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
                with open("../src/data/books.json", "r", encoding="utf-8") as f:
                    books_data = json.load(f)
                    for item in books_data:
                        # 1. Map existing JSON keys to model
                        book_args = {k: v for k, v in item.items() if hasattr(Book, k)}

                        # 2. Logic: If copies is null/None, set to 0
                        # Otherwise, use the value from JSON
                        raw_copies = item.get("copies")
                        num_copies = int(raw_copies) if raw_copies is not None else 0

                        # 3. Apply to both fields to keep them identical
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

    # CHECK 2: Prevent duplicate borrowing of the SAME book
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
    # user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    book = Book.query.get_or_404(book_id)

    if book.availableCopies <= 0:
        return jsonify({"error": "No copies available"}), 400

    # --- THE FIX: Calculate Dates ---
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
        # .filter(BorrowRecord.user_id == user_id, BorrowRecord.status == "borrowed")
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
    # 1. Identify the user from the token
    user_id = int(get_jwt_identity())

    # 2. Find the specific record AND verify it belongs to this user
    # We only look for records with status 'borrowed'
    record = BorrowRecord.query.filter_by(
        id=record_id, user_id=user_id, status="borrowed"
    ).first_or_404()

    # 3. Find the associated book to put it back in stock
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
    # Get the ID from the secure token
    user_id = int(get_jwt_identity())

    # Query only "active" borrowed books
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
                # --- ADDED: ALL EXTRA FIELDS FOR THE MODAL ---
                "series": book.series,
                "volume": book.volume,
                "publisher": book.publisher,
                "datePublished": book.datePublished,
                "genre": book.genre,
                "language": book.language,
                "isbn": book.isbn,
                "numberOfPages": book.numberOfPages,
                "listPrice": book.listPriceUsd,  # Matches the price display
                "summary": book.summary,
                "notes": book.notes,
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
            BorrowRecord.due_date < now + timedelta(days=1),
            BorrowRecord.status == "borrowed",
        ).all()

        for record in overdue_list:
            # 3. Send reminder email
            # Assuming you have a User relationship or can query user by ID
            send_reminder_email(record.user_id, record.book.title)

        db.session.commit()
        print(f"Scan complete: {len(overdue_list)} books marked as overdue.")


# Helper function for the email
def send_reminder_email(user_id, book_title):
    user = User.query.get(user_id)
    if user:
        msg = Message(
            subject="Action Required: Overdue Book",
            recipients=[user.email],
            body=f"Hi {user.full_name  }, the book '{book_title}' is past its due date. Please return it soon!",
        )
        mail.send(msg)


if __name__ == "__main__":
    with app.app_context():
        # 1. Create the database tables based on your model
        db.create_all()

        # 2. Run the seed function
        seed_database()

    # Initialize scheduler
    scheduler.init_app(app)

    # Add the job: runs once every 24 hours
    scheduler.add_job(
        id="overdue_check", func=check_overdue_tasks, trigger="interval", days=1
    )

    scheduler.start()
    app.run(debug=True, port=5000)

import gzip
import json
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Mail, Message
from models import db, User, Book, BorrowRecord, ContactMessage, BookRequest
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_apscheduler import APScheduler
from sqlalchemy.orm import joinedload

# Points to the .env file one directory up (only present in local development)
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "../.env"))

# The React build (`npm run build`), which Flask serves in production
DIST_DIR = os.path.abspath(os.path.join(basedir, "..", "dist"))

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- 1. FULL CONFIGURATION ---


def database_url():
    """Local .env sets SQLALCHEMY_DATABASE_URI; Heroku Postgres sets DATABASE_URL."""
    url = os.getenv("SQLALCHEMY_DATABASE_URI") or os.getenv("DATABASE_URL")
    # Heroku still hands out "postgres://", which SQLAlchemy 1.4+ rejects
    if url and url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


app.config["SQLALCHEMY_DATABASE_URI"] = database_url()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)
# Where the React site runs; used to build links in emails
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# MAIL SERVER CONFIG (Required for Email Verification)
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = (
    "Church in Dunn Loring Library",
    os.getenv("MAIL_DEFAULT_SENDER") or os.getenv("MAIL_USERNAME"),
)


# --- 2. INITIALIZATION ---
db.init_app(app)
jwt = JWTManager(app)
mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config["JWT_SECRET_KEY"])

with app.app_context():
    db.create_all()


def _reset_db_pool_after_fork():
    # gunicorn --preload forks workers after the app connected to the database;
    # each worker must open its own connections instead of sharing the parent's.
    with app.app_context():
        db.engine.dispose(close=False)


os.register_at_fork(after_in_child=_reset_db_pool_after_fork)

COMPRESSIBLE_TYPES = {
    "application/json",
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "image/svg+xml",
}


@app.after_request
def compress_response(response):
    """Gzip large text responses; the full catalog is ~6 MB raw but ~0.2 MB gzipped."""
    if (
        response.status_code != 200
        or response.mimetype not in COMPRESSIBLE_TYPES
        or "Content-Encoding" in response.headers
        or "gzip" not in request.headers.get("Accept-Encoding", "").lower()
    ):
        return response
    response.direct_passthrough = False  # files from send_from_directory
    data = response.get_data()
    if len(data) < 1024:
        return response
    response.set_data(gzip.compress(data, compresslevel=5))
    response.headers["Content-Encoding"] = "gzip"
    response.vary.add("Accept-Encoding")
    return response


# --- 3. AUTHENTICATION & SECURITY ---


LIBRARY_NAME = "Church in Dunn Loring Library"


def send_verification_email(email, role, name):
    """Email the link that activates a new account (sent at sign-up and on login)."""
    token = serializer.dumps(email, salt="email-confirm")
    link = f"{FRONTEND_URL}/verify/{token}?role={role}"
    # No sender= : MAIL_DEFAULT_SENDER shows the library's name, not a bare address
    msg = Message(f"Please confirm your email - {LIBRARY_NAME}", recipients=[email])
    msg.body = f"""Hi {name or "there"},

Welcome to the {LIBRARY_NAME}! Please confirm your email address to activate your account:

{link}

This link expires in 1 hour. If it has expired, just try to log in and we will send you a new one.

If you did not create this account, you can ignore this email.

{LIBRARY_NAME}
{FRONTEND_URL}
"""
    mail.send(msg)


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    full_name = data.get("full_name")
    email = (data.get("email") or "").strip().lower()
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

        # --- EMAIL VERIFICATION ---
        try:
            send_verification_email(email, role, full_name)
            db.session.commit()
        except Exception as e:
            db.session.rollback()  # Crucial! Postgres requires a rollback after a fail
            print(f"Registration failed: {e}")
            return jsonify({"error": str(e)}), 500
        return (
            jsonify(
                {
                    "message": "Registration Successful. A verification link has been sent to your email address. Please click the link within 1 hour to activate your account."
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
    except BadSignature:  # also covers expired links
        return jsonify({"msg": "The link is invalid or has expired"}), 400


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if user:
        token = serializer.dumps(email, salt="password-reset")
        msg = Message(f"Reset your password - {LIBRARY_NAME}", recipients=[email])
        msg.body = f"""Hi {user.full_name or "there"},

We received a request to reset the password for your {LIBRARY_NAME} account. To choose a new password, open this link:

{FRONTEND_URL}/reset-password/{token}

This link expires in 1 hour. If it has expired, you can request a new one from the "Forgot Password?" link on the login page.

If you did not ask to reset your password, you can ignore this email. Your password will not change.

{LIBRARY_NAME}
{FRONTEND_URL}
"""
        mail.send(msg)
    # Same answer either way, so the form can't be used to discover accounts
    return jsonify({"message": "If an account exists, a reset link has been sent"}), 200


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    try:
        email = serializer.loads(data.get("token"), salt="password-reset", max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "The reset link has expired."}), 400
    except BadSignature:
        return jsonify({"error": "Invalid reset link."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User no longer exists."}), 404
    user.set_password(data.get("password"))
    db.session.commit()
    return jsonify({"message": "Password updated successfully!"}), 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")  # The plain text from the form
    role = data.get("role")  # The role from the form

    user = User.query.filter_by(email=email).first()

    # user.check_password handles the complex math of comparing hashes
    if user and user.check_password(password):
        if not user.is_verified:
            send_verification_email(email, user.role, user.full_name)
            return (
                jsonify(
                    {
                        "msg": "Please verify your email first. We just sent you a new verification link."
                    }
                ),
                401,
            )

        if role != user.role:
            return jsonify({"msg": f"You are trying to log in as {role}, but the email or password is invalid."}), 401

        access_token = create_access_token(
            identity=str(user.id)
        )  # Explicitly convert to string

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


def _section_sort_key(row):
    """Sections look like "07 - Concerning Life": order by number, then name, then title."""
    category = row.category or ""
    prefix = category.split(" ", 1)[0]
    number = int(prefix) if prefix.isdigit() else float("inf")
    return (number, category.casefold(), (row.title or "").casefold())


@app.route("/api/catalog", methods=["GET"])
def get_catalog():
    """One page of the catalog for the home page, filtered and sorted on the server.

    Query params: page (1-based), per_page (max 100), search, language,
    availability (in-stock | out-of-stock | all), sort (title | section).
    """
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 20, type=int), 1), 100)
    search = (request.args.get("search") or "").strip()
    language = request.args.get("language") or "All"
    availability = request.args.get("availability") or "in-stock"
    sort = request.args.get("sort") or "title"

    query = db.session.query(Book.id, Book.title, Book.category)
    if search:
        pattern = f"%{search}%"
        query = query.filter(Book.title.ilike(pattern) | Book.author.ilike(pattern))
    if language != "All":
        query = query.filter(Book.language == language)
    if availability == "in-stock":
        query = query.filter(Book.copies > 0)
    elif availability == "out-of-stock":
        query = query.filter((Book.copies == None) | (Book.copies <= 0))  # noqa: E711

    # Sort the light (id, title, category) rows, then load full rows for one page only
    rows = query.all()
    if sort == "section":
        rows.sort(key=_section_sort_key)
    else:
        rows.sort(key=lambda r: (r.title or "").casefold())
    page_ids = [r.id for r in rows[(page - 1) * per_page : page * per_page]]
    books_by_id = {b.id: b for b in Book.query.filter(Book.id.in_(page_ids)).all()}

    languages = sorted(
        lang for (lang,) in db.session.query(Book.language).distinct() if lang
    )
    return jsonify(
        {
            "books": [books_by_id[i].to_dict() for i in page_ids],
            "total": len(rows),
            "page": page,
            "has_more": page * per_page < len(rows),
            "languages": languages,
        }
    )


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
@jwt_required()  # Assuming you use JWT for the admin session
def delete_user():

    # We use query parameters for ease of use in tools like Postman or Curl
    email = request.args.get("email")
    if not email:
        return jsonify({"msg": "Email parameter is required"}), 400

    user = User.query.filter_by(email=email).first()

    if user and str(user.id) == get_jwt_identity():
        return (
            jsonify(
                {
                    "error": "Self-destruction blocked! You cannot delete your own admin account."
                }
            ),
            400,
        )

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
                with open(os.path.join(basedir, "..", "src", "data", "books.json"), encoding="utf-8") as f:
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

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404


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

    book = db.get_or_404(Book, book_id)

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
                "series": book.series,
                "volume": book.volume,
                "publisher": book.publisher,
                "genre": book.genre,
                "language": book.language,
                "isbn": book.isbn,
                "numberOfPages": book.numberOfPages,
                "listPrice": book.listPriceUsd,  # Matches the price display
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
    """Daily job: email members whose books are past their due date."""
    with app.app_context():
        print("Running overdue check...")
        cutoff = datetime.now(timezone.utc)
        records = (
            BorrowRecord.query.options(
                joinedload(BorrowRecord.user), joinedload(BorrowRecord.book)
            )
            .filter(BorrowRecord.due_date < cutoff, BorrowRecord.status == "borrowed")
            .all()
        )

        sent = 0
        for record in records:
            try:
                send_reminder_email(record)
                sent += 1
            except Exception as e:
                print(f"Reminder to user {record.user_id} failed: {e}")
        print(f"Scan complete: {sent}/{len(records)} reminders sent.")


def send_reminder_email(record):
    user = record.user
    if not user:
        return
    mail.send(
        Message(
            subject="Reminder: Library Book Overdue",
            recipients=[user.email],
            body=(
                f"Hi {user.full_name}, the book '{record.book.title}' was due on "
                f"{record.due_date:%Y-%m-%d}. Please return or renew it soon!"
            ),
        )
    )


@app.route("/api/renew/<int:record_id>", methods=["POST"])
@jwt_required()
def renew_book(record_id):
    user_id = int(get_jwt_identity())

    # Find the record and ensure it belongs to the user and isn't returned
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
        # get_jwt_identity() returns the user.id as a string based on your login logic
        user_id = get_jwt_identity()

        # Query the user from the database
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Return the full model information
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


# Uploaded cover images, saved as <book id>.png.
# Heroku's disk is reset on every deploy/restart, so uploads there are temporary.
COVERS_DIR = os.path.join(basedir, "public", "covers")
os.makedirs(COVERS_DIR, exist_ok=True)


def _parse_count(value, label):
    """Form fields arrive as strings; "" means "not provided"."""
    if value in (None, ""):
        return None
    try:
        number = int(value)
    except (ValueError, TypeError):
        raise ValueError(f"{label} must be a whole number")
    if number < 0:
        raise ValueError(f"{label} cannot be negative")
    return number


@app.route("/api/books/<int:id>", methods=["PUT"])
def update_book(id):
    book = db.session.get(Book, id)
    if not book:
        return jsonify({"error": "Book not found"}), 404

    # The admin form sends multipart form data (so it can include a cover image)
    data = request.form if (request.form or request.files) else (request.get_json(silent=True) or {})

    try:
        title = data.get("title")
        if title is not None:
            if not title.strip():
                return jsonify({"error": "Book title cannot be empty"}), 400
            book.title = title.strip()

        if data.get("listPriceUsd") not in (None, ""):
            try:
                price = float(str(data.get("listPriceUsd")).replace("$", "").strip())
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid price format"}), 400
            if price <= 0:
                return jsonify({"error": "Price must be a positive number"}), 400
            book.listPriceUsd = price

        try:
            copies = _parse_count(data.get("copies"), "Total copies")
            available = _parse_count(data.get("availableCopies"), "Available copies")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        if copies is not None:
            book.copies = copies
        if available is not None:
            if available > (book.copies or 0):
                return jsonify({"error": "Available stock cannot exceed total stock"}), 400
            book.availableCopies = available

        for field in ("author", "series", "volume", "publisher", "genre", "language", "isbn", "summary"):
            if field in data:
                setattr(book, field, data.get(field))
        if data.get("numberOfPages") not in (None, ""):
            book.numberOfPages = int(data.get("numberOfPages"))

        cover = request.files.get("coverImage")
        if cover and cover.filename:
            cover.save(os.path.join(COVERS_DIR, f"{id}.png"))
            book.uploadedImageUrl = f"/covers/{id}.png"

        db.session.commit()
        return jsonify({"message": "Book updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/covers/<path:filename>")
def serve_covers(filename):
    return send_from_directory(COVERS_DIR, filename)


# ... (existing imports)


# --- NEW: ROUTE FOR ADMIN BULK EMAIL ---
@app.route("/api/admin/send-email", methods=["POST"])
@jwt_required()
def admin_bulk_email():
    # 1. Identity Check
    user_id = get_jwt_identity()
    admin = db.session.get(User, user_id)

    if not admin or admin.role != "admin":
        return jsonify({"error": "Unauthorized. Admin access required."}), 403

    # 2. Get Data
    data = request.get_json()
    recipients = data.get("recipients")  # Expected: list of strings
    subject = data.get("subject")
    message_body = data.get("message")

    if not recipients or not subject or not message_body:
        return jsonify({"error": "Recipients, subject, and message are required."}), 400

    if not isinstance(recipients, list):
        return jsonify({"error": "Recipients must be a list of email addresses."}), 400

    try:
        # 3. Send Emails
        # Note: We use Bcc to prevent users from seeing each other's email addresses
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


# ... (rest of your existing code: db.init_app, register, etc.)


@app.route("/api/admin/borrow-records", methods=["GET"])
def get_all_borrow_records():
    # Joining with User and Book to get names for the table
    records = (
        db.session.query(BorrowRecord, User, Book)
        .join(User, BorrowRecord.user_id == User.id)
        .join(Book, BorrowRecord.book_id == Book.id)
        .all()
    )

    output = []
    for record, user, book in records:
        output.append(
            {
                "id": record.id,
                "user_name": user.full_name,
                "book_title": book.title,
                "book_id": book.id,
                "borrow_date": record.borrow_date.strftime("%Y-%m-%d"),
                "due_date": record.due_date.strftime("%Y-%m-%d"),
                "status": record.status,
            }
        )
    return jsonify(output)


@app.route("/api/admin/return-book/<int:record_id>", methods=["PATCH"])
def return_book_by_admin(record_id):
    # 1. Find the specific record
    record = db.get_or_404(BorrowRecord, record_id)

    if record.status == "returned":
        return jsonify({"message": "Book already returned"}), 400

    # 2. Update the record status
    record.status = "returned"
    record.return_date = datetime.now(timezone.utc)

    # 3. Increase the available copies in the Book table
    book = db.session.get(Book, record.book_id)
    if book:
        book.availableCopies += 1

    try:
        db.session.commit()
        return jsonify({"message": "Book returned successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/add-book", methods=["POST"])
def add_new_book():
    data = request.get_json()
    new_entry = Book(
        title=data.get("title"),
        # ... other fields ...
        listPriceUsd=data.get("listPriceUsd"),  # The float
        listPrice=data.get("listPriceUsd"),  # The string "XX $"
        copies=data.get("copies"),
        availableCopies=data.get("copies"),
    )
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Saved"}), 201


@app.route("/api/admin/delete-book/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    book = db.get_or_404(Book, book_id)

    # 1. Safety Check: Check if there are active loans for this book
    active_loans = BorrowRecord.query.filter_by(
        book_id=book_id, status="borrowed"
    ).first()

    if active_loans:
        return (
            jsonify(
                {
                    "error": "Cannot delete book. There are active loans currently out. Mark them as returned first."
                }
            ),
            400,
        )

    try:
        # 2. Optional: If you want to keep borrow history but delete the book,
        # you might need to handle foreign key constraints depending on your DB setup.
        # Usually, we just delete the book if all copies are accounted for.
        db.session.delete(book)
        db.session.commit()
        return jsonify({"message": f"Book '{book.title}' deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/promote-user/<int:user_id>", methods=["PATCH"])
def promote_user(user_id):
    # Optional: Verify requester is admin here
    user = db.get_or_404(User, user_id)
    try:
        user.role = "admin"
        user.own_invite_code = User.generate_unique_code()
        db.session.commit()
        return jsonify({"message": "User promoted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/contact_messages", methods=["GET"])
def get_messages():
    # Only admins should see this (add your @admin_required decorator here)
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([m.to_dict() for m in messages])


@app.route("/api/admin/delete-message/<int:msg_id>", methods=["DELETE"])
def delete_message(msg_id):
    msg = db.get_or_404(ContactMessage, msg_id)
    db.session.delete(msg)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@app.route("/api/contact", methods=["POST"])
def save_message():
    data = request.get_json()
    if not data.get("name") or not data.get("email") or not data.get("message"):
        return jsonify({"error": "All fields are required"}), 400

    # Extracting data from the React request
    new_msg = ContactMessage(
        name=data.get("name"), email=data.get("email"), message=data.get("message")
    )

    db.session.add(new_msg)  # This puts it in the "waiting area"
    db.session.commit()  # This saves it permanently to the .db file

    return jsonify({"status": "success", "message": "Saved to database!"}), 201


# --- BOOK REQUESTS (members ask the library to order a book) ---
def current_admin():
    """Return the logged-in user if they are an admin, otherwise None."""
    user = db.session.get(User, int(get_jwt_identity()))
    return user if user and user.role == "admin" else None


@app.route("/api/book-requests", methods=["POST"])
@jwt_required()
def create_book_request():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Please enter the book title."}), 400

    raw_copies = data.get("copies")
    try:
        copies = 1 if raw_copies in (None, "") else int(raw_copies)
    except (ValueError, TypeError):
        return jsonify({"error": "Copies must be a whole number."}), 400
    if not 1 <= copies <= 100:
        return jsonify({"error": "Please request between 1 and 100 copies."}), 400

    book_request = BookRequest(
        user_id=int(get_jwt_identity()),
        title=title,
        author=(data.get("author") or "").strip() or None,
        copies=copies,
        language=(data.get("language") or "").strip()[:100] or None,
        notes=(data.get("notes") or "").strip() or None,
    )
    db.session.add(book_request)
    db.session.commit()
    return jsonify(book_request.to_dict()), 201


@app.route("/api/languages", methods=["GET"])
def get_languages():
    """Languages that appear in the catalog, for dropdowns."""
    languages = sorted(
        lang for (lang,) in db.session.query(Book.language).distinct() if lang
    )
    return jsonify(languages), 200


@app.route("/api/user/book-requests", methods=["GET"])
@jwt_required()
def get_my_book_requests():
    requests = (
        BookRequest.query.filter_by(user_id=int(get_jwt_identity()))
        .order_by(BookRequest.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in requests]), 200


@app.route("/api/admin/book-requests", methods=["GET"])
@jwt_required()
def get_all_book_requests():
    if not current_admin():
        return jsonify({"error": "Admins only"}), 403
    requests = BookRequest.query.order_by(BookRequest.created_at.desc()).all()
    return jsonify([r.to_dict() for r in requests]), 200


@app.route("/api/admin/book-requests/<int:request_id>", methods=["PATCH"])
@jwt_required()
def update_book_request(request_id):
    if not current_admin():
        return jsonify({"error": "Admins only"}), 403
    book_request = db.session.get(BookRequest, request_id)
    if not book_request:
        return jsonify({"error": "Request not found"}), 404

    data = request.get_json() or {}
    if "status" in data:
        if data["status"] not in BookRequest.STATUSES:
            return jsonify({"error": "Invalid status"}), 400
        book_request.status = data["status"]
    if "admin_note" in data:
        book_request.admin_note = (data["admin_note"] or "").strip() or None

    db.session.commit()
    return jsonify(book_request.to_dict()), 200


# --- FRONTEND (production: Flask serves the React build from dist/) ---
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    if path and os.path.isfile(os.path.join(DIST_DIR, path)):
        # Vite puts content hashes in asset file names, so they can be cached for a year
        max_age = 31536000 if path.startswith("assets/") else 0
        return send_from_directory(DIST_DIR, path, max_age=max_age)
    if os.path.isfile(os.path.join(DIST_DIR, "index.html")):
        # Any other path is a React route (/about, /login, ...)
        return send_from_directory(DIST_DIR, "index.html", max_age=0)
    return jsonify({"error": "Frontend not built. Run `npm run build`."}), 404


def add_missing_columns():
    """create_all() only creates missing tables; add columns introduced later.

    (No migration tool is set up, so new columns on existing tables go here.)
    """
    from sqlalchemy import inspect, text

    new_columns = {
        "book_requests": {
            "copies": "INTEGER NOT NULL DEFAULT 1",
            "language": "VARCHAR(100)",
        },
    }
    inspector = inspect(db.engine)
    for table, columns in new_columns.items():
        existing = {c["name"] for c in inspector.get_columns(table)}
        for name, definition in columns.items():
            if name not in existing:
                db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
                print(f"Added column {table}.{name}")
    db.session.commit()


def start_background_services():
    """Import the catalog on first run and start the daily overdue-reminder job.

    Called once per server: from wsgi.py under gunicorn, or below for local runs.
    """
    with app.app_context():
        db.create_all()
        add_missing_columns()
        seed_database()

    if os.getenv("RUN_SCHEDULER", "1") != "1":
        return
    scheduler.init_app(app)
    scheduler.add_job(
        id="overdue_check",
        func=check_overdue_tasks,
        trigger="cron",
        hour=9,
        timezone="America/New_York",
    )
    scheduler.start()


if __name__ == "__main__":
    # The debug reloader runs this file twice; only start services in the real server
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_background_services()
    app.run(debug=True, port=5000)

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from flask_mail import Mail, Message
from models import db, User, Book
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

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
app.config["JWT_SECRET_KEY"] = "libri-stack-super-secret-2026"

# MAIL SERVER CONFIG (Required for Email Verification)
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = ("LibriStack", os.getenv("MAIL_DEFAULT_SENDER"))


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
    email = data.get("email")
    hashed_pw = generate_password_hash(data.get("password"))

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
            email=email,
            phone=data.get("phone"),
            role=role,
            invited_by=inviter_email,
            is_verified=False,
        )
        new_user.set_password(hashed_pw)

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
    user = User.query.filter_by(email=data["email"]).first()
    if user and user.check_password(data["password"]):
        if not user.is_verified:
            return jsonify({"msg": "Please verify your email first!"}), 401
        access_token = create_access_token(identity={"id": user.id, "role": user.role})
        return (
            jsonify(
                {
                    "token": access_token,
                    "role": user.role,
                    "email": user.email,
                    "own_code": user.own_invite_code,
                }
            ),
            200,
        )
    return jsonify({"msg": "Invalid credentials"}), 401


# --- 4. BOOKS API (Paginated for 5,000 entries) ---


@app.route("/api/books", methods=["GET"])
def get_books():
    search = request.args.get("search", "").strip()
    language = request.args.get("language", "All")
    page = request.args.get("page", 1, type=int)

    query = Book.query
    if search:
        query = query.filter(
            Book.title.icontains(search) | Book.author.icontains(search)
        )
    if language != "All":
        query = query.filter(Book.language == language)

    books_paginated = query.paginate(page=page, per_page=20, error_out=False)

    return jsonify(
        {
            "books": [book.to_dict() for book in books_paginated.items],
            "total": books_paginated.total,
            "pages": books_paginated.pages,
            "current_page": books_paginated.page,
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)

import random
import string
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(10), default="user")  # 'admin' or 'user'

    # Verification logic
    is_verified = db.Column(db.Boolean, default=False)

    # Admin-specific logic
    invited_by = db.Column(
        db.String(120), nullable=True
    )  # Email of the admin who invited them
    own_invite_code = db.Column(
        db.String(5), unique=True, nullable=True
    )  # Their unique 5-digit code

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def generate_unique_code():
        """Generates a random 5-digit uppercase alphanumeric code."""
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=5))

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "is_verified": self.is_verified,
            "own_invite_code": self.own_invite_code,
        }


class Book(db.Model):
    __tablename__ = "book"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    language = db.Column(db.String(50), default="English")
    isbn = db.Column(db.String(20), nullable=True)
    description = db.Column(db.Text, nullable=True)
    cover_image = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "language": self.language,
            "isbn": self.isbn,
            "description": self.description,
            "cover_image": self.cover_image,
        }

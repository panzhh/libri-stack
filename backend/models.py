import random
import string
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(10), default="user")  # 'user' or 'admin'

    # --- ADMIN TRACKING FIELDS ---
    # The unique 5-digit code this user owns (if they are an admin)
    own_invite_code = db.Column(db.String(5), unique=True, nullable=True)

    # The email of the admin who invited this person
    invited_by = db.Column(db.String(120), nullable=True)

    def set_password(self, password):
        """Hashes the password for security."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Checks the hashed password against the login input."""
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def generate_unique_code():
        """Generates a random 5-digit uppercase alphanumeric string."""
        characters = string.ascii_uppercase + string.digits
        while True:
            code = "".join(random.choices(characters, k=5))
            # Check if this code is already assigned to someone else
            if not User.query.filter_by(own_invite_code=code).first():
                return code


class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(255), nullable=True)
    author = db.Column(db.String(255), nullable=True)
    language = db.Column(db.String(50), nullable=True)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        """Converts the database object to a dictionary for the React frontend."""
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "author": self.author,
            "language": self.language,
            "stock": self.stock,
            "category": self.category,
            "notes": self.notes,
        }

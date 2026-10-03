import random
import string
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(20), default="user")  # 'admin' or 'user'
    registration_date = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

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
            "phone": self.phone,
            "own_invite_code": self.own_invite_code,
            "registration_date": (
                self.registration_date.strftime("%Y-%m-%d")
                if self.registration_date
                else "N/A"
            ),
        }


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500))
    subtitle = db.Column(db.String(500))
    series = db.Column(db.String(255))
    volume = db.Column(db.String(100))
    author = db.Column(db.String(255))
    publisher = db.Column(db.String(255))
    yearPublished = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    edition = db.Column(db.String(100))
    editor = db.Column(db.String(255))
    summary = db.Column(db.Text)
    wordCount = db.Column(db.Integer)
    numberOfPages = db.Column(db.Integer)
    format = db.Column(db.String(100))
    listPrice = db.Column(db.String(100))  # The "1 $" string
    language = db.Column(db.String(100))
    isbn = db.Column(db.String(50))
    rating = db.Column(db.Float)
    physicalLocation = db.Column(db.String(255))
    status = db.Column(db.String(100))
    quantity = db.Column(db.Integer)
    category = db.Column(db.String(255))
    uploadedImageUrl = db.Column(db.String(10))
    copies = db.Column(db.Integer)
    availableCopies = db.Column(db.Integer)
    listPriceUsd = db.Column(db.Float)  # The numeric price

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}



class BorrowRecord(db.Model):
    __tablename__ = "borrow_records"  # Good practice to name the table

    id = db.Column(db.Integer, primary_key=True)

    # Links to the User table
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    # Links to the Book table
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"), nullable=False)

    # Automatically records when the book was taken
    borrow_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    due_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime)

    # Tracks if it's currently out or brought back
    status = db.Column(db.String(50), default="borrowed")  # "borrowed" or "returned"

    # Optional: Relationship helper to make querying easier
    book = db.relationship("Book", backref="borrow_history")
    user = db.relationship("User")
    renewed = db.Column(db.Boolean, default=False)


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "date": self.created_at.strftime("%Y-%m-%d %H:%M")
        }


class BookRequest(db.Model):
    """A member's request for the library to order a book it doesn't have."""

    __tablename__ = "book_requests"

    STATUSES = ("pending", "ordered", "arrived", "declined")

    id = db.Column(db.Integer, primary_key=True)
    # Shown to members and admins, e.g. ORD-20261003-00042 (see assign_order_number)
    order_number = db.Column(db.String(30), unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    author = db.Column(db.String(255))
    copies = db.Column(db.Integer, nullable=False, default=1, server_default="1")
    # Set when ordered from a catalog book; the price is a snapshot at order time
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"))
    unit_price = db.Column(db.Float)
    language = db.Column(db.String(100))  # None means any language
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default="pending", nullable=False)
    admin_note = db.Column(db.Text)  # e.g. "Expected next month"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship("User", backref="book_requests")

    def assign_order_number(self):
        """ORD-<order date>-<id>: unique because the id is (needs a flushed id)."""
        created = self.created_at or datetime.now(timezone.utc)
        self.order_number = f"ORD-{created:%Y%m%d}-{self.id:05d}"

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "title": self.title,
            "author": self.author,
            "copies": self.copies,
            "book_id": self.book_id,
            "unit_price": self.unit_price,
            "total_price": (
                round(self.unit_price * self.copies, 2)
                if self.unit_price is not None
                else None
            ),
            "language": self.language,
            "notes": self.notes,
            "status": self.status,
            "admin_note": self.admin_note,
            "requested_by": self.user.full_name if self.user else None,
            "requester_email": self.user.email if self.user else None,
            "date": self.created_at.strftime("%Y-%m-%d") if self.created_at else None,
        }

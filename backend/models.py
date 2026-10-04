import random
import string
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

# Book orders are collected weekly, every Sunday from 8:00 PM Eastern Time
LIBRARY_TZ = ZoneInfo("America/New_York")
COLLECTION_WEEKDAY = 6  # Sunday (Monday = 0)
COLLECTION_TIME = time(20, 0)


def order_collection_time(placed_at):
    """The Sunday 8:00 PM ET collection an order placed at `placed_at` belongs to.

    Members can change or delete the order until then. An order placed at or
    after 8:00 PM on a Sunday goes into the following Sunday's collection.
    """
    if placed_at.tzinfo is None:  # stored as UTC without a timezone
        placed_at = placed_at.replace(tzinfo=timezone.utc)
    local = placed_at.astimezone(LIBRARY_TZ)
    days_ahead = (COLLECTION_WEEKDAY - local.weekday()) % 7
    collection = datetime.combine(
        local.date() + timedelta(days=days_ahead), COLLECTION_TIME, tzinfo=LIBRARY_TZ
    )
    if collection <= local:
        collection += timedelta(days=7)
    return collection

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
    # Due date the "due in 3 days" reminder was sent for (a renewal changes the
    # due date, so the new date gets its own reminder)
    due_soon_reminded_for = db.Column(db.DateTime)


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

    STATUSES = ("pending", "ordered", "arrived", "delivered_paid", "declined")

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

    @property
    def collection_time(self):
        return order_collection_time(self.created_at or datetime.now(timezone.utc))

    def can_be_changed(self, now=None):
        """Members may change or delete until the Sunday collection (and while pending)."""
        now = now or datetime.now(timezone.utc)
        return self.status == "pending" and now < self.collection_time

    def to_dict(self):
        collection = self.collection_time
        placed = self.created_at or datetime.now(timezone.utc)
        if placed.tzinfo is None:
            placed = placed.replace(tzinfo=timezone.utc)
        placed = placed.astimezone(LIBRARY_TZ)
        return {
            "id": self.id,
            "ordered_at": placed.isoformat(),
            "ordered_at_display": f"{placed:%Y-%m-%d} {placed:%I:%M %p}".replace(" 0", " "),
            "order_number": self.order_number,
            "collection_date": f"{collection:%A, %B} {collection.day}, {collection.year}",
            "collection_at": collection.isoformat(),
            "can_modify": self.can_be_changed(),
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


class ContactVerification(db.Model):
    """A Contact Us message waiting for the sender to enter the emailed code."""

    __tablename__ = "contact_verifications"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    code_hash = db.Column(db.String(64), nullable=False)  # the code itself is never stored
    ip = db.Column(db.String(64), index=True)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False)  # plain UTC
    expires_at = db.Column(db.DateTime, nullable=False)  # plain UTC

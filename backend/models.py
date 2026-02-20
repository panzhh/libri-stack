import random
import string
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone

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
    authorLastFirst = db.Column(db.String(255))
    illustrator = db.Column(db.String(255))
    narrator = db.Column(db.String(255))
    translator = db.Column(db.String(255))
    publisher = db.Column(db.String(255))
    datePublished = db.Column(db.String(100))
    yearPublished = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    edition = db.Column(db.String(100))
    editor = db.Column(db.String(255))
    summary = db.Column(db.Text)
    guidedReadingLevel = db.Column(db.String(50))
    lexileMeasure = db.Column(db.String(50))
    gradeLevelEquivalent = db.Column(db.String(50))
    developmentalReadingAssessment = db.Column(db.String(50))
    interestLevel = db.Column(db.String(50))
    wordCount = db.Column(db.Integer)
    originalTitle = db.Column(db.String(500))
    numberOfPages = db.Column(db.Integer)
    format = db.Column(db.String(100))
    dimensions = db.Column(db.String(100))
    weight = db.Column(db.String(100))
    listPrice = db.Column(db.String(100))  # The "1 $" string
    language = db.Column(db.String(100))
    ddc = db.Column(db.String(50))
    lcc = db.Column(db.String(50))
    oclc = db.Column(db.String(50))
    isbn = db.Column(db.String(50))
    favorites = db.Column(db.Float)
    rating = db.Column(db.Float)
    physicalLocation = db.Column(db.String(255))
    status = db.Column(db.String(100))
    dateStarted = db.Column(db.String(100))
    dateFinished = db.Column(db.String(100))
    loanedTo = db.Column(db.String(255))
    dateLoaned = db.Column(db.String(100))
    borrowedFrom = db.Column(db.String(255))
    dateBorrowed = db.Column(db.String(100))
    quantity = db.Column(db.Integer)
    condition = db.Column(db.String(100))
    recommendedBy = db.Column(db.String(255))
    dateAdded = db.Column(db.String(100))
    tags = db.Column(db.Text)
    purchaseDate = db.Column(db.String(100))
    purchasePlace = db.Column(db.String(255))
    purchasePrice = db.Column(db.String(100))
    notes = db.Column(db.Text)
    googleVolumeid = db.Column(db.String(100))
    category = db.Column(db.String(255))
    wishList = db.Column(db.Float)
    uploadedImageUrl = db.Column(db.Text)
    copies = db.Column(db.Integer)
    availableCopies = db.Column(db.Integer)
    listPriceUsd = db.Column(db.Float)  # The numeric price
    purchasePriceUsd = db.Column(db.Float)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    # --- ADD THIS TO app.py ---


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
    renewed = db.Column(db.Boolean, default=False)  # Add this line

    


from datetime import datetime, timezone

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

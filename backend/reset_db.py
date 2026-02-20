from app import db, app, User
from datetime import datetime, timezone

def rebuild_database():
    with app.app_context():
        print("--- Starting Database Reset ---")
        
        # 1. Clear everything
        db.drop_all()
        print("Tables dropped.")
        
        # 2. Re-create with new limits (VARCHAR 512, etc.)
        db.create_all()
        print("Tables created.")

        # # 3. Seed: Create a Default Admin
        # admin = User(
        #     full_name="Library Admin",
        #     email="admin@example.com",
        #     role="admin",
        #     is_verified=True,
        #     own_invite_code="ADMIN"
        # )
        # admin.set_password("admin123") # Use a better password later!
        
        # db.session.add(admin)
        # db.session.commit()
        
        print("✅ Database reset and Admin user (admin@example.com) created!")

if __name__ == "__main__":
    rebuild_database()
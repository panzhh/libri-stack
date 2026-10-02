from app import db, app

def rebuild_database():
    with app.app_context():
        print("--- Starting Database Reset ---")
        
        # 1. Clear everything
        db.drop_all()
        print("Tables dropped.")
        
        # 2. Re-create with new limits (VARCHAR 512, etc.)
        db.create_all()
        print("Tables created.")

        print("✅ Database reset!")

if __name__ == "__main__":
    rebuild_database()
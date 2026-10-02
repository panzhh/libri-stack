from app import db, app, seed_database

def rebuild_database():
    with app.app_context():
        print("--- Starting Database Reset ---")
        
        # 1. Clear everything
        db.drop_all()
        print("Tables dropped.")
        db.create_all()
        print("Tables created.")
        seed_database()
        print("✅ Database reset!")

if __name__ == "__main__":
    rebuild_database()
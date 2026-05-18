import sys
import os
from dotenv import load_dotenv

# Load the environment variables from .env
load_dotenv()

# Add the current directory to python path so we can import 'app'
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from sqlalchemy import text

def run_migration():
    print("Starting database migration to add new columns...")
    app = create_app()
    
    with app.app_context():
        try:
            # Check database dialect
            engine_name = db.engine.url.drivername
            print(f"Database engine detected: {engine_name}")
            
            # 1. Add 'zone' column to 'locations' table
            print("Adding 'zone' column to 'locations' table...")
            if 'sqlite' in engine_name:
                try:
                    db.session.execute(text(
                        "ALTER TABLE locations ADD COLUMN zone VARCHAR(100) NOT NULL DEFAULT 'Thực phẩm khô và Nhu yếu phẩm';"
                    ))
                    print("Successfully added 'zone' column to SQLite.")
                except Exception as e:
                    print(f"Note: locations.zone column might already exist: {e}")
            else:
                # PostgreSQL
                db.session.execute(text(
                    "ALTER TABLE locations ADD COLUMN IF NOT EXISTS zone VARCHAR(100) NOT NULL DEFAULT 'Thực phẩm khô và Nhu yếu phẩm';"
                ))
                print("Successfully added 'zone' column to PostgreSQL.")
            
            # 2. Add 'mfg_date' column to 'import_details' table
            print("Adding 'mfg_date' column to 'import_details' table...")
            if 'sqlite' in engine_name:
                try:
                    db.session.execute(text(
                        "ALTER TABLE import_details ADD COLUMN mfg_date DATE;"
                    ))
                    print("Successfully added 'mfg_date' column to SQLite.")
                except Exception as e:
                    print(f"Note: import_details.mfg_date column might already exist: {e}")
            else:
                # PostgreSQL
                db.session.execute(text(
                    "ALTER TABLE import_details ADD COLUMN IF NOT EXISTS mfg_date DATE;"
                ))
                print("Successfully added 'mfg_date' column to PostgreSQL.")
            
            # Commit the changes
            db.session.commit()
            print("Migration completed successfully! All columns added safely.")
            
        except Exception as e:
            db.session.rollback()
            print(f"Migration failed with error: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == '__main__':
    run_migration()

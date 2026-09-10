"""
Phase 2 database migration script.
Adds new columns and tables to the existing database without destroying data.
Run once: python migrate.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from database import db

def migrate():
    app = create_app()
    with app.app_context():
        # Detect DB type
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        is_sqlite = 'sqlite' in db_uri
        print(f"DB URI type: {'SQLite' if is_sqlite else 'MySQL'}")

        with db.engine.connect() as conn:
            if is_sqlite:
                # SQLite: check and add columns with ALTER TABLE
                from sqlalchemy import text, inspect as sa_inspect
                inspector = sa_inspect(db.engine)

                # Add columns to users table if missing
                existing_cols = [c['name'] for c in inspector.get_columns('users')]
                print(f"Existing user columns: {existing_cols}")

                if 'career_interest' not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN career_interest VARCHAR(150)"))
                    print("  Added: users.career_interest")

                if 'target_career_id' not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN target_career_id INTEGER REFERENCES career_roles(id)"))
                    print("  Added: users.target_career_id")

                career_columns = [c['name'] for c in inspector.get_columns('career_roles')]
                if 'category' not in career_columns:
                    conn.execute(text("ALTER TABLE career_roles ADD COLUMN category VARCHAR(80)"))
                    print("  Added: career_roles.category")
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_career_roles_category ON career_roles (category)"))

                conn.commit()
            else:
                # MySQL: use raw ALTER TABLE with IF NOT EXISTS via information_schema check
                from sqlalchemy import text
                result = conn.execute(text(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
                    "WHERE TABLE_NAME='users' AND TABLE_SCHEMA=DATABASE()"
                ))
                existing = {r[0] for r in result}

                if 'career_interest' not in existing:
                    conn.execute(text("ALTER TABLE users ADD COLUMN career_interest VARCHAR(150)"))
                    print("  Added: users.career_interest")

                if 'target_career_id' not in existing:
                    conn.execute(text("ALTER TABLE users ADD COLUMN target_career_id INT, ADD CONSTRAINT fk_user_career FOREIGN KEY (target_career_id) REFERENCES career_roles(id) ON DELETE SET NULL"))
                    print("  Added: users.target_career_id")

                career_columns = conn.execute(text(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
                    "WHERE TABLE_NAME='career_roles' AND TABLE_SCHEMA=DATABASE()"
                ))
                if 'category' not in {r[0] for r in career_columns}:
                    conn.execute(text("ALTER TABLE career_roles ADD COLUMN category VARCHAR(80)"))
                    print("  Added: career_roles.category")
                indexes = conn.execute(text(
                    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS "
                    "WHERE TABLE_NAME='career_roles' AND TABLE_SCHEMA=DATABASE()"
                ))
                if 'ix_career_roles_category' not in {r[0] for r in indexes}:
                    conn.execute(text("CREATE INDEX ix_career_roles_category ON career_roles (category)"))

                conn.commit()

        # Create all new tables (student_skills) – safe, won't recreate existing ones
        db.create_all()
        print("All new tables created (student_skills, etc.).")
        print("Migration complete.")

if __name__ == '__main__':
    migrate()

import os
import socket
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-dev-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # DB configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'skill_gap_db')

    @classmethod
    def get_database_uri(cls):
        env_db_url = os.getenv('DATABASE_URL')
        
        # Test if MySQL port is accessible locally
        mysql_accessible = False
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.0)
            result = sock.connect_ex((cls.DB_HOST, cls.DB_PORT))
            if result == 0:
                mysql_accessible = True
            sock.close()
        except Exception:
            mysql_accessible = False

        if mysql_accessible:
            if env_db_url:
                return env_db_url
            return f"mysql+pymysql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
        else:
            # Fallback to local SQLite database
            db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'skill_gap.db'))
            return f"sqlite:///{db_path}"

SQLALCHEMY_DATABASE_URI = Config.get_database_uri()


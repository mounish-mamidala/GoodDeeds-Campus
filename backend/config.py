
import os
from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")

    if os.getenv("TIDB_HOST"):
        SQLALCHEMY_DATABASE_URI = URL.create(
            drivername="mysql+pymysql",
            username=os.getenv("TIDB_USER"),
            password=os.getenv("TIDB_PASSWORD"),
            host=os.getenv("TIDB_HOST"),
            port=int(os.getenv("TIDB_PORT", "4000")),
            database=os.getenv("TIDB_DATABASE", "gooddeeds_campus")
        )
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv(
            "DATABASE_URL",
            "mysql+pymysql://root:password@localhost/gooddeeds_campus"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Prevent reuse of stale database connections
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 1800
    }

    TIDB_CA_PATH = os.getenv("TIDB_CA_PATH")

    # Preserve TiDB SSL configuration
    if TIDB_CA_PATH and os.getenv("TIDB_HOST"):
        SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {
            "ssl_ca": TIDB_CA_PATH,
            "ssl_verify_cert": True,
            "ssl_verify_identity": True
        }

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = (
        os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true"
    )

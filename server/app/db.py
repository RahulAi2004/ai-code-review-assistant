"""MongoDB connection.

- If MONGODB_URI is set (e.g. a MongoDB Atlas connection string), use a real
  MongoDB via pymongo.
- Otherwise fall back to an in-memory MongoDB (mongomock) so the app works with
  zero setup during development. In-memory data is EPHEMERAL (lost on restart);
  set MONGODB_URI for real persistence and for deployment.
"""
import os

_client = None
DB_NAME = "aicodereview"


def get_client():
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if uri:
            from pymongo import MongoClient

            _client = MongoClient(uri, serverSelectionTimeoutMS=8000)
            print("[db] connected to MongoDB")
        else:
            import mongomock

            _client = mongomock.MongoClient()
            print(
                "[db] MONGODB_URI not set — using an in-memory MongoDB (data is ephemeral). "
                "Set MONGODB_URI in server/.env for persistence."
            )
    return _client


def get_db():
    return get_client()[DB_NAME]


def is_db_ready() -> bool:
    try:
        if os.getenv("MONGODB_URI"):
            get_client().admin.command("ping")
        else:
            get_client()  # mongomock is always ready
        return True
    except Exception:
        return False

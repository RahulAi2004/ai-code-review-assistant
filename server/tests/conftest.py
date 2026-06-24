import os
import sys

# Ensure the server/ directory is importable so `from app...` works.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force in-memory MongoDB (mongomock) for tests regardless of any local .env.
os.environ.pop("MONGODB_URI", None)

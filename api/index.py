"""Vercel Python serverless entry point.

Vercel's @vercel/python runtime detects the ASGI `app` variable below and serves
it. We import the existing FastAPI app from the server/ package (bundled via the
`includeFiles` config in vercel.json).
"""
import os
import sys

# Make the server/ directory importable so `from app.main import app` works.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "server"))

from app.main import app  # noqa: E402  (FastAPI ASGI app — served by Vercel)

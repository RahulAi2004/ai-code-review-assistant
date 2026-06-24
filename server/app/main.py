"""FastAPI application for the AI Code Review Assistant.

Mirrors the original Express API contract so the React frontend works unchanged:
all errors are returned as { "error": "..." } with the appropriate status code.
"""
import os

from dotenv import load_dotenv

load_dotenv()  # load server/.env before importing modules that read env vars

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from .db import is_db_ready
from .routers import auth as auth_router
from .routers import reviews as reviews_router
from .routers import review as review_router

app = FastAPI(title="AI Code Review Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Error handlers: always respond with { "error": "..." } ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Invalid request body.") if errors else "Invalid request body."
    return JSONResponse(status_code=400, content={"error": msg})


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    print("[error]", str(exc))
    return JSONResponse(status_code=500, content={"error": str(exc) or "Internal server error"})


# --- Health check ---
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "geminiConfigured": bool(os.getenv("GEMINI_API_KEY")),
        "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
        "dbConnected": is_db_ready(),
    }


# --- Routers (auth/reviews mounted before the catch-all review router) ---
app.include_router(auth_router.router, prefix="/api/auth")
app.include_router(reviews_router.router, prefix="/api/reviews")
app.include_router(review_router.router, prefix="/api")

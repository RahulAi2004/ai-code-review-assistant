"""Review history routes: list, get one, delete. Also exposes save_review()."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from ..db import get_db, is_db_ready
from ..auth import require_user, require_db

router = APIRouter()

SEVERITIES = ["critical", "high", "medium", "low", "info"]


def to_list_json(r: dict) -> dict:
    counts = {s: 0 for s in SEVERITIES}
    for issue in r.get("issues", []):
        sev = issue.get("severity")
        if sev in counts:
            counts[sev] += 1
    created = r.get("createdAt")
    return {
        "id": str(r["_id"]),
        "source": r.get("source"),
        "filename": r.get("filename"),
        "language": r.get("language"),
        "score": r.get("score"),
        "summary": r.get("summary"),
        "issueCount": len(r.get("issues", [])),
        "severityCounts": counts,
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else created,
    }


def save_review(user_id, source, filename, review) -> str | None:
    """Save a review for a user if the DB is ready and the user is logged in.
    Best-effort: never raises into the review request flow."""
    if not user_id or not is_db_ready() or not review:
        return None
    try:
        db = get_db()
        doc = {
            "user": ObjectId(user_id),
            "source": source or "paste",
            "filename": filename or None,
            "language": review.get("language"),
            "score": review.get("score"),
            "summary": review.get("summary"),
            "issues": review.get("issues", []),
            "strengths": review.get("strengths", []),
            "createdAt": datetime.now(timezone.utc),
        }
        return str(db.reviews.insert_one(doc).inserted_id)
    except Exception as err:  # noqa: BLE001
        print("[reviews] failed to save review:", err)
        return None


@router.get("")
def list_reviews(user_id: str = Depends(require_user)):
    require_db()
    db = get_db()
    docs = list(db.reviews.find({"user": ObjectId(user_id)}).sort("createdAt", -1).limit(100))
    return {"reviews": [to_list_json(d) for d in docs]}


@router.get("/{review_id}")
def get_one(review_id: str, user_id: str = Depends(require_user)):
    require_db()
    db = get_db()
    try:
        oid = ObjectId(review_id)
    except InvalidId:
        raise HTTPException(404, "Review not found.")
    r = db.reviews.find_one({"_id": oid, "user": ObjectId(user_id)})
    if not r:
        raise HTTPException(404, "Review not found.")
    r["id"] = str(r["_id"])
    r["_id"] = str(r["_id"])
    r["user"] = str(r["user"])
    created = r.get("createdAt")
    if hasattr(created, "isoformat"):
        r["createdAt"] = created.isoformat()
    return {"review": r}


@router.delete("/{review_id}")
def delete_one(review_id: str, user_id: str = Depends(require_user)):
    require_db()
    db = get_db()
    try:
        oid = ObjectId(review_id)
    except InvalidId:
        raise HTTPException(404, "Review not found.")
    result = db.reviews.delete_one({"_id": oid, "user": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Review not found.")
    return {"ok": True}

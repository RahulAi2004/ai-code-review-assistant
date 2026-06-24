"""Code-review routes: paste/upload snippet and GitHub URL."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import optional_user
from ..gemini_service import review_code
from ..github_service import fetch_github_files
from .reviews import save_review

router = APIRouter()


class ReviewIn(BaseModel):
    code: str | None = None
    language: str | None = "auto"
    filename: str | None = ""
    source: str | None = "paste"


class GithubIn(BaseModel):
    url: str | None = None


@router.post("/review")
def post_review(body: ReviewIn, user_id=Depends(optional_user)):
    """Review a single snippet. If authenticated, save it to the user's history."""
    if not body.code or not body.code.strip():
        raise HTTPException(400, 'Field "code" is required.')
    review = review_code(body.code, body.language or "auto", body.filename or "")
    saved_id = save_review(
        user_id, "upload" if body.source == "upload" else "paste", body.filename, review
    )
    return {"filename": body.filename or None, "review": review, "savedId": saved_id}


@router.post("/review/github")
def post_github(body: GithubIn, user_id=Depends(optional_user)):
    """Fetch code from a public GitHub repo / PR / file URL and review each file."""
    if not body.url or not body.url.strip():
        raise HTTPException(400, 'Field "url" is required.')

    result = fetch_github_files(body.url)
    source, files = result["source"], result["files"]

    reviews = []
    for f in files:
        try:
            review = review_code(f["content"], "auto", f["path"])
            saved_id = save_review(user_id, "github", f["path"], review)
            reviews.append({"filename": f["path"], "review": review, "savedId": saved_id})
        except Exception as err:  # noqa: BLE001
            reviews.append({"filename": f["path"], "error": str(err)})

    return {"source": source, "fileCount": len(files), "reviews": reviews}

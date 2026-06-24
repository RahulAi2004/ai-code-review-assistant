import pytest
from app.github_service import parse_github_url


def test_parse_repo_url():
    r = parse_github_url("https://github.com/facebook/react")
    assert r["type"] == "repo"
    assert r["owner"] == "facebook"
    assert r["repo"] == "react"


def test_strip_trailing_git():
    r = parse_github_url("https://github.com/owner/repo.git")
    assert r["type"] == "repo"
    assert r["repo"] == "repo"


def test_parse_pr_url():
    r = parse_github_url("https://github.com/owner/repo/pull/123")
    assert r["type"] == "pr"
    assert r["number"] == "123"


def test_parse_blob_url():
    r = parse_github_url("https://github.com/owner/repo/blob/main/src/app.js")
    assert r["type"] == "file"
    assert r["branch"] == "main"
    assert r["path"] == "src/app.js"


def test_parse_invalid_url():
    with pytest.raises(ValueError):
        parse_github_url("https://example.com/foo")

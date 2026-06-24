from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_health_ok():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert isinstance(body["geminiConfigured"], bool)


def test_review_without_code_returns_400():
    res = client.post("/api/review", json={})
    assert res.status_code == 400
    assert "code" in res.json()["error"].lower()


def test_review_blank_code_returns_400():
    res = client.post("/api/review", json={"code": "   "})
    assert res.status_code == 400


def test_github_review_without_url_returns_400():
    res = client.post("/api/review/github", json={})
    assert res.status_code == 400
    assert "url" in res.json()["error"].lower()


def test_unknown_route_returns_404():
    res = client.get("/api/does-not-exist")
    assert res.status_code == 404

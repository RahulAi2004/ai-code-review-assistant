from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

CREDS = {"name": "Test User", "email": "test@example.com", "password": "secret123"}
_token = {}


def test_register_creates_account():
    res = client.post("/api/auth/register", json=CREDS)
    assert res.status_code == 201
    body = res.json()
    assert body["token"]
    assert body["user"]["email"] == "test@example.com"
    _token["t"] = body["token"]


def test_register_rejects_duplicate_email():
    res = client.post("/api/auth/register", json=CREDS)
    assert res.status_code == 409


def test_register_rejects_short_password():
    res = client.post("/api/auth/register", json={"name": "X", "email": "x@y.com", "password": "123"})
    assert res.status_code == 400


def test_login_succeeds():
    res = client.post("/api/auth/login", json={"email": CREDS["email"], "password": CREDS["password"]})
    assert res.status_code == 200
    assert res.json()["token"]


def test_login_wrong_password():
    res = client.post("/api/auth/login", json={"email": CREDS["email"], "password": "wrongpass"})
    assert res.status_code == 401


def test_me_requires_token():
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_valid_token():
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {_token['t']}"})
    assert res.status_code == 200
    assert res.json()["user"]["email"] == CREDS["email"]


def test_reviews_requires_auth():
    assert client.get("/api/reviews").status_code == 401


def test_reviews_returns_history_for_user():
    res = client.get("/api/reviews", headers={"Authorization": f"Bearer {_token['t']}"})
    assert res.status_code == 200
    assert isinstance(res.json()["reviews"], list)

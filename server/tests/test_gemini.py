import pytest
from app.gemini_service import extract_json, normalise_review


# ---------- extract_json ----------

def test_extract_plain_json():
    obj = extract_json('{"summary":"ok","score":80}')
    assert obj["summary"] == "ok"
    assert obj["score"] == 80


def test_extract_fenced_json():
    obj = extract_json('```json\n{"summary":"fenced","score":50}\n```')
    assert obj["summary"] == "fenced"


def test_extract_json_among_prose():
    obj = extract_json('Here is your review: {"score": 42} — hope it helps!')
    assert obj["score"] == 42


def test_extract_no_json_raises():
    with pytest.raises(ValueError):
        extract_json("no json here")


def test_extract_code_fence_inside_string():
    # Regression: a ``` inside a JSON string value must not be mistaken for a fence.
    text = '{"summary":"fix it","suggestion":"```sql\\nSELECT 1;\\n```"}'
    obj = extract_json(text)
    assert obj["summary"] == "fix it"
    assert "SELECT 1;" in obj["suggestion"]


# ---------- normalise_review ----------

def test_normalise_defaults():
    r = normalise_review({}, "python")
    assert r["language"] == "python"
    assert r["issues"] == []
    assert r["strengths"] == []
    assert r["score"] is None


def test_normalise_rounds_score():
    assert normalise_review({"score": 87.6}, "auto")["score"] == 88


def test_normalise_invalid_severity():
    r = normalise_review({"issues": [{"severity": "apocalyptic", "title": "X"}]}, "auto")
    assert r["issues"][0]["severity"] == "info"


def test_normalise_keeps_valid_severity_and_line():
    r = normalise_review({"issues": [{"severity": "high", "line": 12, "title": "Bug"}]}, "auto")
    assert r["issues"][0]["severity"] == "high"
    assert r["issues"][0]["line"] == 12


def test_normalise_nulls_non_integer_line():
    r = normalise_review({"issues": [{"severity": "low", "line": "oops"}]}, "auto")
    assert r["issues"][0]["line"] is None

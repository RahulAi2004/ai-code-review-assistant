from app.prompts import build_review_prompt, REVIEW_JSON_SHAPE


def test_prompt_embeds_code():
    prompt = build_review_prompt("const x = 1;", "javascript")
    assert "const x = 1;" in prompt


def test_prompt_includes_language_hint():
    assert "python" in build_review_prompt("print(1)", "python")


def test_prompt_auto_detect():
    assert "detect" in build_review_prompt("x", "auto").lower()


def test_prompt_includes_filename():
    assert "app.js" in build_review_prompt("x", "auto", "app.js")


def test_prompt_embeds_json_shape():
    assert REVIEW_JSON_SHAPE in build_review_prompt("x", "auto")

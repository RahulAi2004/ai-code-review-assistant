"""Gemini code-review service: builds the prompt, calls the model, and
parses/normalises the response into a predictable shape."""
import os
import re
import json
import time

import google.generativeai as genai

from .prompts import build_review_prompt

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print(
        "[gemini] GEMINI_API_KEY is not set. Copy server/.env.example to server/.env "
        "and add your key."
    )

VALID_SEVERITIES = ["critical", "high", "medium", "low", "info"]


def extract_json(text: str) -> dict:
    """Pull the first {...} JSON object out of a model response, tolerating
    stray markdown fences or prose around it."""
    trimmed = (text or "").strip()

    # Only strip a code fence if the WHOLE response is wrapped in one, so we don't
    # wrongly match backticks inside a JSON string value (e.g. a code snippet in
    # the "suggestion" field).
    candidate = trimmed
    if trimmed.startswith("```"):
        m = re.search(r"```(?:json)?\s*([\s\S]*?)```", trimmed, re.IGNORECASE)
        if m:
            candidate = m.group(1)

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in model response")
    return json.loads(candidate[start : end + 1])


def normalise_review(raw: dict, fallback_language: str) -> dict:
    """Normalise the model output so the frontend always gets a predictable shape."""
    issues = []
    for i in raw.get("issues") or []:
        severity = i.get("severity")
        line = i.get("line")
        issues.append(
            {
                "severity": severity if severity in VALID_SEVERITIES else "info",
                "category": i.get("category") or "best-practice",
                "line": line if isinstance(line, int) and not isinstance(line, bool) else None,
                "title": i.get("title") or "Issue",
                "description": i.get("description") or "",
                "suggestion": i.get("suggestion") or "",
            }
        )

    score = raw.get("score")
    return {
        "summary": raw.get("summary") or "No summary returned.",
        "score": round(score) if isinstance(score, (int, float)) and not isinstance(score, bool) else None,
        "language": raw.get("language") or fallback_language or "unknown",
        "issues": issues,
        "strengths": raw.get("strengths") if isinstance(raw.get("strengths"), list) else [],
    }


def _generate_with_retry(model, prompt, attempts: int = 4):
    """Retry transient 503/429 ("high demand") errors with a short backoff."""
    last = None
    for i in range(attempts):
        try:
            return model.generate_content(prompt)
        except Exception as err:  # noqa: BLE001
            last = err
            transient = re.search(
                r"\b(503|429|overloaded|high demand|Service Unavailable|UNAVAILABLE|ResourceExhausted)\b",
                str(err),
                re.IGNORECASE,
            )
            if not transient or i == attempts - 1:
                raise
            time.sleep(1.5 * (i + 1))
    raise last


def review_code(code: str, language: str = "auto", filename: str = "") -> dict:
    """Run an AI code review on a single piece of code."""
    if not API_KEY:
        raise ValueError("Gemini API key is not configured on the server.")
    if not code or not code.strip():
        raise ValueError("No code provided to review.")

    model = genai.GenerativeModel(
        MODEL_NAME,
        generation_config={
            "temperature": 0.2,
            "response_mime_type": "application/json",
            "max_output_tokens": 8192,
        },
    )

    prompt = build_review_prompt(code, language, filename)
    result = _generate_with_retry(model, prompt)
    text = result.text

    try:
        parsed = extract_json(text)
    except Exception as err:  # noqa: BLE001
        raise ValueError(f"Failed to parse AI response: {err}")

    return normalise_review(parsed, language)

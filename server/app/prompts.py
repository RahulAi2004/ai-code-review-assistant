"""Builds the instruction prompt sent to Gemini for a code review.

We force a strict JSON shape so the frontend can render structured results.
"""

REVIEW_JSON_SHAPE = """{
  "summary": "string — 2-3 sentence overall assessment of the code",
  "score": "number from 0 to 100 — overall code quality score",
  "language": "string — the detected programming language",
  "issues": [
    {
      "severity": "one of: critical | high | medium | low | info",
      "category": "one of: bug | security | performance | style | maintainability | best-practice",
      "line": "number or null — the line number the issue refers to, if identifiable",
      "title": "string — short issue title",
      "description": "string — what is wrong and why it matters",
      "suggestion": "string — concrete fix, including a short code snippet when helpful"
    }
  ],
  "strengths": ["string — things the code does well"]
}"""


def build_review_prompt(code: str, language: str = "auto", filename: str = "") -> str:
    lang_hint = (
        f"The code is written in {language}."
        if language and language != "auto"
        else "Detect the programming language yourself."
    )
    file_hint = f'The file is named "{filename}".' if filename else ""

    return f"""You are a meticulous senior software engineer performing a code review.
{lang_hint} {file_hint}

Review the code below for: correctness bugs, security vulnerabilities, performance
problems, error handling, readability, naming, and adherence to best practices.
Be specific and actionable. Do not invent issues that are not present — if the code
is solid, say so and return few or no issues.

Respond with ONLY a valid JSON object (no markdown, no code fences) matching exactly
this shape:
{REVIEW_JSON_SHAPE}

Here is the code to review:
```
{code}
```"""

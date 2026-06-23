# Test Cases & Testing Report
### AI Code Review Assistant

| | |
|---|---|
| **Project** | AI Code Review Assistant |
| **Author** | Adyana Begum (22108150) |
| **Document version** | 1.0 |
| **Date** | 2026-06-23 |

This document records the testing strategy and the test cases for the project,
covering **unit**, **integration**, and **system / user-acceptance** testing as
required by the course.

---

## 1. Testing Strategy

| Level | Scope | Tooling |
|-------|-------|---------|
| **Unit** | Pure functions: prompt builder, GitHub URL parser, AI response parsing/normalising, API client | Node.js built-in test runner (`node --test`), Vitest |
| **Integration** | Express API routes (request validation, status codes, error shape) and React result rendering | Supertest + Express, Vitest + React Testing Library |
| **System** | End-to-end review flows in the browser | Manual |
| **UAT** | Real-user scenarios and usability | Manual feedback |

**How to run the automated tests**

```bash
# Backend (24 tests)
cd server && npm test

# Frontend (component + api tests)
cd client && npm test
```

---

## 2. Automated Unit Tests (Backend)

| # | Test case | Input | Expected result | Status |
|---|-----------|-------|-----------------|--------|
| U-01 | Prompt embeds code | code = `const x = 1;` | Prompt contains the code | ✅ |
| U-02 | Prompt includes language hint | language = `python` | Prompt mentions "python" | ✅ |
| U-03 | Prompt auto-detect mode | language = `auto` | Prompt asks model to detect language | ✅ |
| U-04 | Prompt includes filename | filename = `app.js` | Prompt mentions filename | ✅ |
| U-05 | Prompt embeds JSON contract | — | Prompt contains the required JSON shape | ✅ |
| U-06 | Parse repo URL | `github.com/facebook/react` | type=repo, owner=facebook, repo=react | ✅ |
| U-07 | Strip trailing `.git` | `…/owner/repo.git` | repo=repo | ✅ |
| U-08 | Parse PR URL | `…/owner/repo/pull/123` | type=pr, number=123 | ✅ |
| U-09 | Parse file (blob) URL | `…/blob/main/src/app.js` | type=file, branch=main, path=src/app.js | ✅ |
| U-10 | Reject non-GitHub URL | `example.com/foo` | Throws parse error | ✅ |
| U-11 | Extract plain JSON | `{"score":80}` | Parsed object, score=80 | ✅ |
| U-12 | Extract fenced JSON | ` ```json … ``` ` | Parsed object | ✅ |
| U-13 | Extract JSON among prose | `text {…} text` | Parsed object | ✅ |
| U-14 | No JSON present | `no json here` | Throws error | ✅ |
| U-15 | Normalise defaults | `{}` | Empty issues/strengths, score=null | ✅ |
| U-16 | Round score | score = 87.6 | score = 88 | ✅ |
| U-17 | Invalid severity coerced | severity = `apocalyptic` | severity = `info` | ✅ |
| U-18 | Valid severity + line kept | severity=high, line=12 | Unchanged | ✅ |
| U-19 | Non-integer line nulled | line = `oops` | line = null | ✅ |

## 3. Automated Integration Tests (Backend API)

| # | Test case | Request | Expected result | Status |
|---|-----------|---------|-----------------|--------|
| I-01 | Health check | `GET /api/health` | 200, `status: ok`, boolean `geminiConfigured` | ✅ |
| I-02 | Review without code | `POST /api/review {}` | 400, error mentions "code" | ✅ |
| I-03 | Review with blank code | `POST /api/review {code:"  "}` | 400 | ✅ |
| I-04 | GitHub review without URL | `POST /api/review/github {}` | 400, error mentions "url" | ✅ |
| I-05 | Unknown route | `GET /api/does-not-exist` | 404 | ✅ |

## 4. Automated Tests (Frontend)

| # | Test case | Expected result | Status |
|---|-----------|-----------------|--------|
| F-01 | Empty result renders nothing | Component renders empty | ✅ |
| F-02 | Single review shows summary/score/file | Text + score `72` + `app.js` visible | ✅ |
| F-03 | Issues render with title and fix | Issue titles and suggestions visible | ✅ |
| F-04 | Strengths section renders | Strength text visible | ✅ |
| F-05 | Clean file shows "No issues found" pill | Pill visible | ✅ |
| F-06 | GitHub multi-file result renders header | `owner/repo` and file count visible | ✅ |
| F-07 | `reviewSnippet` POSTs to `/api/review` | Correct URL + method, returns body | ✅ |
| F-08 | `reviewGithub` POSTs to `/api/review/github` | Correct URL + method | ✅ |
| F-09 | Non-ok response throws server error | Rejects with server message | ✅ |

---

## 5. Manual System Test Cases

| # | Scenario | Steps | Expected result | Status |
|---|----------|-------|-----------------|--------|
| S-01 | Paste vulnerable code | Open app, keep the SQL-injection sample, click *Review code* | Review flags a security issue; score reflects severity | ⬜ run in demo |
| S-02 | Upload a file | Switch to *Upload*, choose a `.js`/`.py` file | File loads into editor; review runs | ⬜ |
| S-03 | Review a GitHub repo | Paste a public repo URL, click *Review code* | Up to 10 files reviewed; per-file cards shown | ⬜ |
| S-04 | Review a GitHub PR | Paste a `/pull/<n>` URL | Only changed files reviewed | ⬜ |
| S-05 | Missing API key | Run server without `GEMINI_API_KEY`, attempt review | Clear error message shown in UI | ⬜ |
| S-06 | Invalid GitHub URL | Paste `example.com/foo` | "Could not parse that as a GitHub URL" | ⬜ |
| S-07 | Responsiveness | Resize browser below 900px | Layout collapses to one column | ⬜ |

> Mark the manual cases ✅ during your live demonstration and attach screenshots
> in the final report.

---

## 6. User Acceptance Testing (UAT)

| Question | Target |
|----------|--------|
| Could the user submit code and understand the review without help? | ≥ 90% of testers |
| Were severity levels and suggested fixes clear? | ≥ 90% |
| Did the review complete in an acceptable time? | ≤ 8s typical |
| Would the user use this tool again? | Qualitative |

**Process:** collect feedback from 3–5 peers, log issues found, fix bugs,
and note usability improvements made as a result.

---

## 7. Results Summary

| Suite | Tests | Passing |
|-------|-------|---------|
| Backend unit | 19 | 19 ✅ |
| Backend integration | 5 | 5 ✅ |
| Frontend | 9 | 9 ✅ |
| **Total automated** | **33** | **33 ✅** |

Manual system and UAT cases are executed during the live demonstration.

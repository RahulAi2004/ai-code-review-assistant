<div align="center">

# AI Code Review Assistant

### Final Project Report

<br>

## Project Title: AI Code Review Assistant
## Subject: Software Engineering
## Submitted By: Rahul Kumar

<br>

**Software Engineering — AI-Based Individual Project**

| Field | Detail |
|---|---|
| **Project Title** | AI Code Review Assistant |
| **Subject** | Software Engineering |
| **Submitted By** | Rahul Kumar |
| **Student ID** | bsai23108172 |
| **Repository** | https://github.com/RahulAi2004/ai-code-review-assistant |
| **Live Deployment** | http://168.144.144.184/ |
| **Document Version** | 1.0 |
| **Date** | June 2026 |

</div>

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Scope](#5-scope)
6. [Existing System Analysis](#6-existing-system-analysis)
7. [Proposed Solution](#7-proposed-solution)
8. [Requirement Engineering](#8-requirement-engineering)
9. [System Architecture & Design](#9-system-architecture--design)
10. [Technology Stack](#10-technology-stack)
11. [AI-Assisted Development](#11-ai-assisted-development)
12. [Implementation Details](#12-implementation-details)
13. [Database Design](#13-database-design)
14. [Security Implementation](#14-security-implementation)
15. [Testing](#15-testing)
16. [Deployment](#16-deployment)
17. [User Manual](#17-user-manual)
18. [Results & Discussion](#18-results--discussion)
19. [Challenges & Solutions](#19-challenges--solutions)
20. [Future Enhancements](#20-future-enhancements)
21. [Conclusion](#21-conclusion)
22. [References](#22-references)
23. [Appendix](#23-appendix)

---

## 1. Abstract

The **AI Code Review Assistant** is a full-stack web application that performs
automated, AI-powered reviews of source code. A developer can submit code in three
ways — pasting it into an in-browser editor, uploading a source file, or providing a
public GitHub repository / pull-request / file URL — and instantly receives a
structured review produced by Google's Gemini large language model. Each review
contains an overall summary, a quality score from 0 to 100, a list of issues
classified by severity and category (each with a suggested fix and line reference),
and a list of the code's strengths.

The system is built as a **React** single-page frontend and a **FastAPI (Python)**
backend, with **MongoDB** for persistence and **JWT** authentication for user
accounts and saved review history. The entire product was developed using an
AI-assisted workflow (Claude Code and ChatGPT-style tooling for code generation,
debugging, and documentation), and is deployed live on a self-managed Ubuntu server
behind nginx. The project demonstrates the complete software-engineering lifecycle —
from requirement engineering and design through implementation, automated testing
(43 tests), and production deployment.

---

## 2. Introduction

Code review is one of the most valuable but time-consuming activities in software
development. It improves code quality, catches bugs and security vulnerabilities
early, and helps developers learn. However, human review is slow, inconsistent, and
often unavailable to students or solo developers who lack a team.

Recent advances in Large Language Models (LLMs) make it possible to automate a
meaningful first pass of code review. The **AI Code Review Assistant** harnesses
Google Gemini to give any developer an instant, structured, and educational review
of their code — anywhere, at any time. This report documents the design,
development, testing, and deployment of the system as an individual software
engineering project built with modern AI-assisted methods.

---

## 3. Problem Statement

Developers — especially students and individuals working without a team — lack
fast, consistent, and accessible feedback on the quality of their code. Manual code
review depends on the availability of an experienced reviewer, is subjective, and
does not scale. As a result, bugs, security flaws (such as SQL injection),
performance problems, and poor practices frequently go unnoticed until much later,
when they are more expensive to fix.

**There is a need for an automated tool that reviews source code instantly,
identifies issues by severity, explains *why* each issue matters, and suggests
concrete fixes — accessible through a simple web interface.**

---

## 4. Objectives

- To build a working web application that reviews source code using AI.
- To support multiple input methods: pasted code, uploaded files, and GitHub URLs.
- To return **structured, actionable** feedback (summary, score, severity-classified
  issues, suggested fixes, strengths) rather than free-form text.
- To provide **user accounts** and a **saved review history** with analytics.
- To keep the AI provider key secure by routing all AI calls through a backend.
- To apply the full software-engineering process: requirements, design, testing,
  and deployment.
- To use **AI tools throughout the development workflow** and document their usage.

---

## 5. Scope

### In scope
- Web-based code review for many programming languages (auto-detected).
- Three input modes: paste (Monaco editor), file upload, and GitHub repo/PR/file.
- Structured AI review with severity/category classification and a quality score.
- JWT-based authentication; per-user persistent review history.
- A history dashboard with analytics (severity distribution, score trend).
- Markdown export of reviews and one-click copying of suggested fixes.
- Light/dark theme.
- Automated test suite and production deployment.

### Out of scope (current version)
- Editing/auto-applying fixes directly back into a GitHub repository.
- Real-time collaborative review.
- IDE plugins (the product is web-based).
- Private GitHub repositories (only public URLs are supported).

---

## 6. Existing System Analysis

| System | Description | Limitation addressed by this project |
|--------|-------------|--------------------------------------|
| **Manual peer review** | A human reviews a pull request. | Slow, subjective, requires an available reviewer. |
| **Linters (ESLint, Pylint)** | Rule-based static analysis. | Only catch predefined patterns; no semantic understanding or explanations. |
| **GitHub Copilot / IDE AI** | AI autocompletion inside the editor. | Focused on writing code, not on structured review of existing code with severity grading. |
| **SonarQube** | Enterprise static analysis platform. | Heavyweight, complex to set up, not beginner-friendly. |

**Gap:** none of the above provide a lightweight, web-accessible tool that gives a
*structured, severity-graded, AI-explained* review with suggested fixes and a quality
score, usable instantly by a student or solo developer. The AI Code Review Assistant
fills this gap.

---

## 7. Proposed Solution

The proposed system is a single-page web application backed by an API server that
orchestrates an LLM. The user submits code; the backend builds a carefully engineered
prompt instructing Gemini to return a **strict JSON** review; the backend parses and
normalises that JSON; and the frontend renders it as a severity-coded report with a
quality-score ring. Logged-in users have every review saved to a history dashboard
with charts.

**Key design decision — why a backend?** The Gemini API key must never reach the
browser, and fetching code from GitHub requires server-side requests. A thin FastAPI
backend keeps secrets safe and centralises all external calls.

---

## 8. Requirement Engineering

A full Software Requirement Specification is provided in
[SRS.md](SRS.md). A summary follows.

### 8.1 Functional Requirements (selected)

| ID | Requirement |
|----|-------------|
| FR-1 | Review code pasted into an in-browser editor with syntax highlighting. |
| FR-3 | Upload a source file and review it. |
| FR-4 | Review a public GitHub repository, pull request, or single-file URL. |
| FR-5 | Send code to Gemini using a structured-review prompt. |
| FR-6/7 | Return a summary, 0–100 score, severity/category-classified issues (with line + suggested fix), and strengths. |
| FR-8/9 | For a repo, review up to 10 files; for a PR, review only its changed files. |
| FR-12 | Show clear error messages on failure. |
| (Auth) | Register, log in, and persist per-user review history. |

### 8.2 Non-Functional Requirements (selected)

| Category | Requirement |
|----------|-------------|
| **Security** | API key only on the server; passwords hashed (bcrypt); JWT-authenticated APIs. |
| **Performance** | A snippet review typically completes in ~2–8 s (Gemini-bound). |
| **Reliability** | Malformed AI responses are tolerated via JSON extraction + normalisation; transient API errors are retried. |
| **Usability** | Single-screen two-panel layout; severity colour-coding; responsive. |
| **Maintainability** | Modular code (prompt / AI service / GitHub service / routers separated). |
| **Portability** | Runs on any OS with Python 3.10+ (backend) and a modern browser. |

---

## 9. System Architecture & Design

### 9.1 High-level architecture

```
┌──────────────────────────┐        ┌────────────────────────────┐
│      React Client        │  /api  │     FastAPI Backend (Py)    │
│  (Vite + Monaco editor)  │ ─────▶ │  routers: review/auth/...   │
│  • Paste / Upload / GH   │ ◀───── │  gemini_service  ───────────┼──▶ Gemini API
│  • Results + History     │  JSON  │  github_service  ───────────┼──▶ GitHub API
└──────────────────────────┘        │  PyMongo  ──────────────────┼──▶ MongoDB
                                     └────────────────────────────┘
```

The complete set of **UML diagrams** — Use Case, Activity, Sequence, Class, ER, and
Data Flow — is provided in [DESIGN.md](DESIGN.md). The application follows a clean
layered architecture:

- **Presentation layer** — React components (`App.jsx`, `ReviewResults.jsx`,
  `HistoryPanel.jsx`, `StatsPanel.jsx`, `AuthModal.jsx`).
- **API layer** — FastAPI routers that validate requests and shape responses.
- **Service layer** — `gemini_service.py` (AI review) and `github_service.py`
  (code fetching).
- **Data layer** — MongoDB collections (`users`, `reviews`) via PyMongo.

### 9.2 Request flow (paste review)

1. User pastes code and clicks **Review code**.
2. Frontend `POST /api/review` with `{ code, language, filename }` (+ JWT if logged in).
3. Backend validates input, builds the review prompt, and calls Gemini (with retry).
4. Backend parses/normalises the JSON response.
5. If authenticated, the review is saved to the user's history.
6. Frontend renders the score, issues, and strengths.

---

## 10. Technology Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | React 19, Vite, @monaco-editor/react | Fast, modern SPA with a professional code editor. |
| Styling | Custom CSS (glassmorphism, theming) | Full control, light/dark themes, no framework bloat. |
| Backend | Python, FastAPI, Uvicorn | Async, auto-generated Swagger docs, clean validation. |
| AI Engine | Google Gemini (`gemini-2.5-flash-lite`) | Strong code understanding, generous free tier. |
| Database | MongoDB (PyMongo; mongomock for dev) | Flexible document model fits the review schema. |
| Auth | JWT (PyJWT) + bcrypt | Stateless, secure password storage. |
| External | GitHub REST API (httpx) | Fetch repo/PR/file source code. |
| Web server | nginx + systemd | Reverse proxy + process management in production. |
| Hosting | DigitalOcean Droplet (Ubuntu 24.04) | Full-control, always-on VPS. |

---

## 11. AI-Assisted Development

This project was built with an **AI-assisted development workflow**, a core
requirement of the course. AI tools were used across the lifecycle:

| Phase | How AI was used |
|-------|-----------------|
| **Code generation** | Generated the initial React + FastAPI scaffolding, services, and components. |
| **Debugging** | Diagnosed and fixed real bugs (e.g. a JSON-parsing bug where a markdown code fence inside a suggestion broke the parser; a JSX runtime mis-config in tests). |
| **Optimization** | Added transient-error retry and an output-token budget to the Gemini service. |
| **Documentation** | Produced the SRS, design document, test cases, and this report. |
| **Testing** | Generated unit and integration test suites (pytest + Vitest). |
| **UI generation** | Produced and iteratively refined the UI (glassmorphism, charts, theming). |

Additionally, **Gemini is the runtime AI engine** that performs the code reviews
themselves. A detailed prompt → output → modification log is maintained in
[AI_USAGE.md](AI_USAGE.md).

**Understanding of generated code:** all generated code was reviewed and is
understood — the architecture (layered SPA + API), components, database schema, REST
API, and state management (React Context for auth/theme) are documented throughout
this report and the design document.

---

## 12. Implementation Details

### 12.1 Frontend
- **`App.jsx`** — top-level state, the three input tabs (paste / upload / GitHub),
  the Monaco editor, theme toggle, and the run action.
- **`ReviewResults.jsx`** — renders a review: a conic-gradient score ring,
  severity-coded issue cards, suggested-fix code blocks with copy buttons, and a
  Markdown export button.
- **`HistoryPanel.jsx` / `StatsPanel.jsx`** — the saved-review list plus an analytics
  dashboard (stat tiles, an SVG severity donut, and a score-trend bar chart).
- **`AuthContext.jsx`** — authentication state (JWT in `localStorage`).
- **`api.js`** — typed wrapper around the backend, attaching the auth token.

### 12.2 Backend
- **`gemini_service.py`** — builds the prompt, calls Gemini with
  `response_mime_type=application/json`, retries transient 503/429 errors, then
  extracts and normalises the JSON.
- **`github_service.py`** — parses GitHub URLs (repo / PR / blob), fetches source
  files via the GitHub REST API (capped at 10 files / 60 KB each).
- **`routers/`** — `review.py` (review endpoints), `auth.py` (register/login/me),
  `reviews.py` (history CRUD).
- **`main.py`** — FastAPI app, CORS, health check, and error handlers that always
  return `{ "error": ... }`.

### 12.3 AI prompt engineering
The model is instructed to act as a meticulous senior engineer and to respond with
**only** a JSON object matching a fixed schema (summary, score, language, issues[],
strengths[]). The backend tolerates stray markdown fences and prose, slicing out the
outer JSON object before parsing — making the system robust to imperfect model output.

---

## 13. Database Design

Two MongoDB collections (modelled in the ER diagram in [DESIGN.md](DESIGN.md)):

**`users`**
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | primary key |
| `name` | string | |
| `email` | string | unique, lowercased |
| `passwordHash` | string | bcrypt hash |
| `createdAt` | datetime | |

**`reviews`**
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | primary key |
| `user` | ObjectId | references `users._id` |
| `source` | string | paste / upload / github |
| `filename` | string | nullable |
| `language` | string | |
| `score` | number | 0–100 |
| `summary` | string | |
| `issues` | array | embedded issue objects |
| `strengths` | array | strings |
| `createdAt` | datetime | |

In development, an in-memory MongoDB (`mongomock`) is used automatically so the app
runs with zero setup; in production a real MongoDB connection string is configured.

---

## 14. Security Implementation

- **API key protection** — the Gemini key lives only in the server's environment
  and is never exposed to the browser.
- **Password hashing** — user passwords are hashed with **bcrypt**; plaintext is
  never stored.
- **Authentication** — stateless **JWT** tokens (7-day expiry) signed with a server
  secret; protected routes require a valid `Authorization: Bearer` header.
- **Input validation** — request bodies are validated; invalid input returns a clear
  400 error.
- **Resource limits** — GitHub fetching is capped (≤10 files, ≤60 KB/file) and the
  request body is limited, preventing abuse.
- **Secrets management** — secrets are stored in a `.env` file excluded from version
  control via `.gitignore`.

---

## 15. Testing

A full test matrix is in [TEST_CASES.md](TEST_CASES.md). The project includes
**43 automated tests**, all passing:

| Suite | Tests | Tooling |
|-------|-------|---------|
| Backend unit (prompt, GitHub parsing, JSON parsing/normalising) | 20 | pytest |
| Backend integration (API routes, validation, health, 404) | 5 | pytest + FastAPI TestClient |
| Backend auth/DB integration (register, login, me, history) | 9 | pytest + mongomock |
| Frontend (results rendering, API client) | 9 | Vitest + React Testing Library |

**Testing levels performed**
- **Unit testing** — pure functions (prompt builder, URL parser, JSON normaliser).
- **Integration testing** — API endpoints end-to-end against an in-memory database.
- **System testing** — the full workflow exercised manually in the browser (e.g.
  the bundled SQL-injection sample is correctly flagged as a critical security issue).
- **User Acceptance Testing** — usability feedback collected and addressed (e.g. UI
  polish, theme toggle, copy/export features).

Run the suites with:
```bash
cd server && pytest      # backend
cd client && npm test    # frontend
```

---

## 16. Deployment

The application is deployed on a **DigitalOcean droplet** (Ubuntu 24.04, 2 vCPU /
2 GB RAM) and is publicly accessible.

**Architecture in production**
```
Internet → nginx (port 80)
   ├── /        → React production build (static files)
   └── /api/*   → FastAPI (Uvicorn :5000, managed by systemd) → Gemini + MongoDB
```

- The **React app** is built with Vite and served as static files by nginx.
- The **FastAPI backend** runs under **Uvicorn**, supervised by a **systemd**
  service (`aicodereview.service`) so it restarts automatically and survives reboots.
- **nginx** serves the frontend and reverse-proxies `/api` to the backend (same
  origin → no CORS).
- A repeatable setup script (`deploy/setup.sh`) provisions the whole stack; full
  instructions are in [deploy/README.md](../deploy/README.md).

**Live URL:** http://168.144.144.184/  ·  **API docs:** http://168.144.144.184/docs

---

## 17. User Manual

### 17.1 Reviewing code
1. Open the app in a browser.
2. Choose an input tab:
   - **Paste code** — type or paste into the editor and pick a language (or *auto*).
   - **Upload file** — choose a `.js`, `.py`, `.java`, etc. file; it loads into the editor.
   - **GitHub URL** — paste a public repo, `/pull/<n>`, or `/blob/...` file URL.
3. Click **Review code**.
4. Read the results on the right: the **score ring**, **strengths**, and
   **issues** (each colour-coded by severity with a suggested fix).
5. Use **⬇ Export .md** to download the review, or the **Copy** button on any fix.

### 17.2 Accounts & history
1. Click **Sign in** (top-right) → **Sign up** to create an account.
2. While signed in, every review is **saved automatically**.
3. Your **history** appears in the left panel with an **analytics dashboard**
   (severity donut + score trend). Click any item to reopen it; use 🗑 to delete.

### 17.3 Theme
Use the ☀️/🌙 button (top-right) to switch between light and dark mode.

---

## 18. Results & Discussion

The completed system meets all stated objectives:
- ✅ Instant, structured AI reviews across three input methods.
- ✅ Severity-graded issues with suggested fixes and a 0–100 quality score.
- ✅ Authentication and a persistent history dashboard with analytics.
- ✅ Secure backend that protects the API key.
- ✅ 43 automated tests passing; live production deployment.

**Example result:** submitting a vulnerable `getUser(id)` function that builds SQL by
string concatenation yields a low score (~10–15/100) and a **critical / security**
issue titled *"SQL Injection Vulnerability"*, along with error-handling and naming
issues — demonstrating genuine semantic understanding beyond a simple linter.

*(Insert screenshots here for the final submission: home screen, a completed review,
the history dashboard, and the deployed live URL.)*

---

## 19. Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Model occasionally wrapped a code fence inside a JSON string, breaking parsing. | Rewrote the JSON extractor to only un-fence when the *whole* response is fenced; added a regression test. |
| `gemini-2.0-flash` had a zero free-tier quota on the project. | Switched to `gemini-2.5-flash-lite`. |
| Transient `503 high demand` errors from Gemini. | Added automatic retry with backoff. |
| Deploying a Python + React monorepo to serverless (Vercel) hit routing/size limits. | Moved to a self-managed VPS (DigitalOcean) with nginx + systemd — simpler and more reliable. |
| Running MongoDB locally for development. | Used `mongomock` as a zero-setup in-memory fallback. |

---

## 20. Future Enhancements

- **"Fix it for me"** — a second AI pass that returns the fully corrected file.
- **GitHub PR inline comments** — post findings back as review comments.
- **PDF export** of reviews.
- **Configurable focus** — e.g. "security only" or "performance only" reviews.
- **Streaming** results as they are generated.
- **HTTPS + custom domain** via Let's Encrypt.
- **Team workspaces** and shared review history.

---

## 21. Conclusion

The AI Code Review Assistant successfully demonstrates an end-to-end, AI-powered
software product built with modern, AI-assisted development methods. It applies the
full software-engineering lifecycle — requirement engineering, layered design with
UML, secure implementation, automated testing, and production deployment — to solve a
real problem: giving developers instant, structured, and educational code review.
The project is fully functional, tested, documented, and live on a public server.

---

## 22. References

1. Google Gemini API — https://ai.google.dev/
2. FastAPI documentation — https://fastapi.tiangolo.com/
3. React documentation — https://react.dev/
4. Vite — https://vite.dev/
5. MongoDB — https://www.mongodb.com/docs/
6. GitHub REST API — https://docs.github.com/rest
7. nginx — https://nginx.org/en/docs/
8. JSON Web Tokens — https://jwt.io/

---

## 23. Appendix

| Resource | Link |
|----------|------|
| **GitHub Repository** | https://github.com/RahulAi2004/ai-code-review-assistant |
| **Live Application** | http://168.144.144.184/ |
| **API Documentation (Swagger)** | http://168.144.144.184/docs |
| **SRS Document** | [docs/SRS.md](SRS.md) |
| **Design Document (UML)** | [docs/DESIGN.md](DESIGN.md) |
| **Test Cases & Report** | [docs/TEST_CASES.md](TEST_CASES.md) |
| **Deployment Guide** | [deploy/README.md](../deploy/README.md) |
| **AI Usage Log** | [docs/AI_USAGE.md](AI_USAGE.md) |

---

<div align="center">
<em>End of Report</em>
</div>

# Software Requirement Specification (SRS)
### AI Code Review Assistant

| | |
|---|---|
| **Project** | AI Code Review Assistant |
| **Author** | Adyana Begum (22108150) |
| **Course** | Software Engineering — AI-Based Individual Project |
| **Document version** | 1.0 |
| **Date** | 2026-06-23 |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **AI Code Review
Assistant**, a web application that automatically reviews source code using a
large language model (Google Gemini) and returns structured, actionable feedback.
It is intended for the developer, evaluators, and any future contributor as the
authoritative description of what the system must do.

### 1.2 Scope
The system lets a user submit code in one of three ways — pasting it into an
in-browser editor, uploading a source file, or providing a public GitHub URL
(repository, pull request, or single file) — and receive an AI-generated review
for each file. A review contains an overall summary, a quality score (0–100), a
list of issues classified by severity and category (each with a suggested fix and
line reference), and a list of the code's strengths.

The application is split into a **React frontend** and an **Express backend**. The
backend keeps the Gemini API key secret and performs all calls to Gemini and to
the GitHub REST API. In the current phase the system has **no database and no user
authentication**; reviews are computed on demand and not persisted. Persistence
and login are planned for a later phase (see [Section 8](#8-future-scope)).

### 1.3 Definitions, Acronyms, Abbreviations
| Term | Meaning |
|------|---------|
| **LLM** | Large Language Model |
| **Gemini** | Google's LLM, used as the review engine |
| **PR** | Pull Request (GitHub) |
| **SRS** | Software Requirement Specification |
| **API** | Application Programming Interface |
| **Issue severity** | One of: critical, high, medium, low, info |
| **Issue category** | One of: bug, security, performance, style, maintainability, best-practice |

### 1.4 References
- Google Gemini API — https://ai.google.dev/
- GitHub REST API — https://docs.github.com/rest
- React — https://react.dev · Vite — https://vite.dev · Express — https://expressjs.com

---

## 2. Overall Description

### 2.1 System Overview
The AI Code Review Assistant is a client–server web application.

```
User → React client → Express backend → Gemini API   (AI review)
                                      → GitHub API    (fetch code)
```

The client collects code and renders results; the backend orchestrates the AI
review and external data fetching. The two communicate over a small JSON HTTP API.

### 2.2 Product Functions (summary)
- Accept code via paste, file upload, or GitHub URL.
- Send code to Gemini with a structured-review prompt.
- Parse and normalise the AI response into a predictable JSON shape.
- Fetch reviewable source files from a GitHub repo, PR, or file URL.
- Display a per-file review: summary, score, severity-coded issues, suggested
  fixes, and strengths.

### 2.3 User Characteristics
| User | Description | Technical level |
|------|-------------|-----------------|
| **Student / Developer** | Primary user. Submits code to get feedback and learn from it. | Beginner → intermediate programmer. |
| **Reviewer / Evaluator** | Course evaluator assessing the project. | Technical. |
| **Maintainer** | Developer extending the project. | Intermediate → advanced. |

No login is required in the current phase, so any visitor can use all features.

### 2.4 Operating Environment
- **Client:** any modern desktop browser (Chrome, Edge, Firefox) with JavaScript.
- **Server:** Node.js 18+ runtime (developed on Node 24).
- **External services:** Google Gemini API and GitHub REST API (internet required).

### 2.5 Design and Implementation Constraints
- The Gemini API key must never be exposed to the browser — all AI calls are
  proxied through the backend.
- Free-tier Gemini and unauthenticated GitHub access impose rate limits.
- GitHub fetching is capped (max 10 files, max ~60 KB per file) to bound cost and
  latency.
- The AI response must be coerced into a fixed JSON schema; the model occasionally
  returns malformed JSON, which the backend must tolerate.

### 2.6 Assumptions and Dependencies
- The user has a valid Gemini API key configured on the server.
- Submitted GitHub URLs point to **public** repositories.
- The internet and the external APIs are available.
- Reviews are advisory; the AI may miss issues or report false positives.

---

## 3. Functional Requirements

Each requirement has a unique ID (FR-n) and a priority (High / Medium / Low).

| ID | Requirement | Priority |
|----|-------------|----------|
| **FR-1** | The system shall let the user paste code into an in-browser code editor with syntax highlighting. | High |
| **FR-2** | The system shall let the user select the programming language or choose automatic detection. | Medium |
| **FR-3** | The system shall let the user upload a source file, loading its contents into the editor. | High |
| **FR-4** | The system shall let the user submit a public GitHub repository, pull request, or single-file URL. | High |
| **FR-5** | The system shall send submitted code to the Gemini API using a structured-review prompt. | High |
| **FR-6** | The system shall return, per file, a summary, a 0–100 quality score, a list of issues, and a list of strengths. | High |
| **FR-7** | Each issue shall include a severity, a category, an optional line number, a title, a description, and a suggested fix. | High |
| **FR-8** | For a GitHub repository, the system shall review the first 10 source files of the default branch. | Medium |
| **FR-9** | For a GitHub pull request, the system shall review only the files changed by that PR. | Medium |
| **FR-10** | The system shall display issues sorted by severity (critical → info) with colour-coded badges. | Medium |
| **FR-11** | The system shall show a loading indicator while a review is in progress. | Low |
| **FR-12** | The system shall display a clear error message when a review fails (e.g. missing key, invalid URL, API error). | High |
| **FR-13** | The system shall expose a health-check endpoint reporting whether the AI key is configured. | Low |
| **FR-14** | If reviewing one GitHub file fails, the system shall still return reviews for the remaining files. | Medium |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| **NFR-1** | **Security** | The Gemini API key shall reside only on the server and never be sent to the client. Secrets are loaded from environment variables and excluded from version control. |
| **NFR-2** | **Performance** | A single-snippet review shall typically complete within ~3–8 seconds, subject to the Gemini API. The request body is capped at 2 MB. |
| **NFR-3** | **Reliability** | Malformed AI responses shall be handled gracefully (JSON extraction + normalisation) without crashing the server. |
| **NFR-4** | **Scalability** | GitHub fetching is bounded (≤10 files, ≤60 KB/file) so a large repo cannot overload the request or AI cost. The stateless backend can be horizontally scaled. |
| **NFR-5** | **Usability** | The UI shall be a single-screen, two-panel layout (input / results), responsive down to mobile widths, with severity colour-coding for quick scanning. |
| **NFR-6** | **Maintainability** | Code is modular: prompt, AI service, GitHub service, and routes are separated; the frontend separates API, components, and styling. |
| **NFR-7** | **Availability** | The frontend and backend are independently deployable (e.g. Vercel + Render) so either can be updated without the other. |
| **NFR-8** | **Portability** | The app runs on any OS with Node.js 18+ and a modern browser. |

---

## 5. External Interface Requirements

### 5.1 User Interface
A single-page application with a header, a two-column body (left: input panel with
tabs for *Paste / Upload / GitHub*; right: results panel), and a footer. See the
[Design Document](DESIGN.md) for wireframe notes.

### 5.2 Software Interfaces (HTTP API)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Report server status and whether the AI key is configured. |
| `/api/review` | POST | Review a single snippet. Body: `{ code, language?, filename? }`. |
| `/api/review/github` | POST | Review code from a GitHub URL. Body: `{ url }`. |

### 5.3 External API Interfaces
- **Gemini API** — receives the review prompt, returns the review as JSON text.
- **GitHub REST API** — provides repository trees, PR file lists, and file contents.

---

## 6. Use Cases

### UC-1: Review a pasted snippet
- **Actor:** Developer
- **Precondition:** Server is running with a valid Gemini key.
- **Main flow:** User pastes code → selects language → clicks *Review code* →
  backend calls Gemini → results render with score and issues.
- **Alternate:** AI key missing → backend returns an error → UI shows the message.

### UC-2: Upload a file for review
- **Actor:** Developer
- **Main flow:** User selects a file → contents load into the editor → user clicks
  *Review code* → same review flow as UC-1.

### UC-3: Review a GitHub repository
- **Actor:** Developer
- **Main flow:** User pastes a repo URL → backend resolves the default branch,
  lists source files (≤10), fetches each, reviews each → per-file results render.
- **Alternate:** No source files found → backend returns an explanatory error.

### UC-4: Review a GitHub pull request
- **Actor:** Developer
- **Main flow:** User pastes a `/pull/<n>` URL → backend lists the PR's changed
  files → fetches the head version of each → reviews each.

### UC-5: Check service health
- **Actor:** Maintainer / Deployment platform
- **Main flow:** Client calls `/api/health` → receives status and key-configured
  flag.

(A graphical use-case diagram is in the [Design Document](DESIGN.md#1-use-case-diagram).)

---

## 7. Constraints and Assumptions
- **Constraint:** Free-tier API rate limits cap throughput.
- **Constraint:** Only public GitHub URLs are supported (no private-repo auth flow).
- **Constraint:** Reviews are not stored — refreshing the page clears results.
- **Assumption:** Users understand AI feedback is advisory, not authoritative.

---

## 8. Future Scope
Planned for later phases (not in the current build):
- **Database** (e.g. MongoDB) to persist users and past reviews.
- **Authentication** (Firebase Auth / JWT) and per-user review history.
- **Inline PR comments** posted back to GitHub.
- **Automated tests** (unit + integration) and CI.
- **Deployment** to Vercel (frontend) and Render (backend).

These map to the ER diagram and class diagram in the Design Document, which already
model the intended `User`, `Review`, and `Issue` entities.

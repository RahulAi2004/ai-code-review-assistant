# AI Code Review Assistant

An AI-powered web application that reviews source code and returns structured,
actionable feedback — bugs, security issues, performance problems, and style
suggestions — with a quality score per file. Built for the Software Engineering
individual project.

You can review code three ways:

1. **Paste** code into an in-browser editor (Monaco).
2. **Upload** a source file.
3. **Link a GitHub** repository, pull request, or single file URL.

The AI engine is **Google Gemini**, called from a **FastAPI (Python)** backend so
the API key never reaches the browser.

---

## ✨ Features

- 🤖 **AI code review** powered by Gemini, returning structured JSON (summary,
  score, issues by severity/category, suggested fixes, strengths).
- 📝 **Three input modes** — paste, file upload, GitHub URL.
- 🐙 **GitHub integration** — reviews a whole repo (first 10 source files), a
  pull request (only its changed files), or a single file.
- 🎨 **Severity-coded UI** — critical / high / medium / low / info, each with a
  suggested fix and the line it refers to.
- 🔢 **Quality score** (0–100) per file with a color-coded ring.
- 🔐 **User accounts** (JWT auth) with a saved **review history** dashboard.
- 💾 **MongoDB persistence** — every review by a logged-in user is stored.
- ⬇️ **Export to Markdown** and one-click **copy** of any suggested fix.
- ⚡ **Fast & keyless frontend** — the backend proxies all AI calls.
- 🙋 **Works signed-out too** — reviews run in guest mode (just not saved).

---

## 🏗️ Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   React client (Vite)   │        │   FastAPI backend (Python)│
│                         │  /api  │                           │
│  • Monaco code editor   │ ─────▶ │  POST /api/review         │ ──▶ Gemini API
│  • Paste / Upload / GH  │        │  POST /api/review/github  │ ──▶ GitHub REST API
│  • Results panel        │ ◀───── │  GET  /api/health         │
└─────────────────────────┘  JSON  └──────────────────────────┘
```

**Why a backend?** The Gemini API key must stay secret, and GitHub fetching needs
server-side requests. The React app holds no secrets.

### Tech stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React 19, Vite, @monaco-editor/react, Context API       |
| Backend   | Python, FastAPI, Uvicorn, google-generativeai           |
| AI        | Google Gemini (`gemini-2.5-flash-lite` by default)      |
| Database  | MongoDB via PyMongo (in-memory `mongomock` for dev)     |
| Auth      | JWT (PyJWT) + bcrypt password hashing                   |
| External  | GitHub REST API (via httpx)                             |

---

## 📁 Folder structure

```
.
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api.js              # calls to the backend API (+ auth token)
│   │   ├── App.jsx            # main UI: tabs, editor, run, history
│   │   ├── App.css           # all component styles
│   │   ├── auth/AuthContext.jsx    # auth provider (token + user)
│   │   ├── utils/exportReview.js   # markdown export + clipboard
│   │   └── components/
│   │       ├── ReviewResults.jsx   # renders the structured review
│   │       ├── AuthModal.jsx       # login / register modal
│   │       └── HistoryPanel.jsx    # saved-review history list
│   ├── vite.config.js         # dev proxy /api -> :5000
│   └── .env.example
│
├── server/                     # FastAPI backend (Python)
│   ├── app/
│   │   ├── main.py            # FastAPI app, health, error handlers, routers
│   │   ├── db.py             # Mongo connection (URI or in-memory mongomock)
│   │   ├── auth.py           # JWT + bcrypt + auth dependencies
│   │   ├── gemini_service.py  # Gemini call + JSON parsing/normalising
│   │   ├── github_service.py  # fetch files from repo / PR / file URL
│   │   ├── prompts.py        # the code-review prompt + JSON shape
│   │   └── routers/
│   │       ├── review.py     # /api/review and /api/review/github
│   │       ├── auth.py       # /api/auth register / login / me
│   │       └── reviews.py    # /api/reviews history CRUD
│   ├── tests/                 # pytest unit + integration suites
│   ├── run.py                 # uvicorn entry point
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting started

### Prerequisites

- **Python 3.10+** (developed on Python 3.12)
- **Node.js 18+** (for the React frontend only)
- A free **Gemini API key** — https://aistudio.google.com/app/apikey

### 1. Backend (FastAPI)

```bash
cd server
python -m venv .venv
.venv\Scripts\activate           # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env           # then edit .env and paste your GEMINI_API_KEY
python run.py                    # starts http://localhost:5000
```

> Interactive API docs (Swagger UI) are auto-generated at
> **http://localhost:5000/docs**.

### 2. Frontend (React)

In a second terminal:

```bash
cd client
npm install
npm run dev                 # starts http://localhost:5173
```

Open **http://localhost:5173** and start reviewing code.

---

## 🔑 Environment variables

### `server/.env`

| Variable         | Required | Description                                                        |
|------------------|----------|--------------------------------------------------------------------|
| `GEMINI_API_KEY` | ✅       | Your Google Gemini API key.                                        |
| `GEMINI_MODEL`   | ❌       | Gemini model id. Defaults to `gemini-2.5-flash-lite`.              |
| `PORT`           | ❌       | Backend port. Defaults to `5000`.                                  |
| `GITHUB_TOKEN`   | ❌       | GitHub PAT (`public_repo`) to raise the API rate limit to 5000/hr. |
| `MONGODB_URI`    | ❌       | MongoDB connection string (e.g. Atlas). If omitted, an **in-memory** MongoDB is used (data is ephemeral). |
| `JWT_SECRET`     | ❌       | Secret for signing auth tokens. Set a long random value in production. |

### `client/.env` (optional)

| Variable        | Required | Description                                              |
|-----------------|----------|----------------------------------------------------------|
| `VITE_API_BASE` | ❌       | Deployed backend URL in production. Empty in dev (proxy).|

---

## 📡 API reference

### `GET /api/health`
Returns server status and whether the Gemini key is configured.

```json
{ "status": "ok", "geminiConfigured": true, "model": "gemini-2.5-flash-lite" }
```

### `POST /api/review`
Review a single snippet.

**Request**
```json
{ "code": "function add(a,b){return a+b}", "language": "javascript", "filename": "math.js" }
```

**Response**
```json
{
  "filename": "math.js",
  "review": {
    "summary": "Simple and correct addition function.",
    "score": 90,
    "language": "javascript",
    "issues": [
      {
        "severity": "low",
        "category": "best-practice",
        "line": 1,
        "title": "Missing input validation",
        "description": "The function assumes both arguments are numbers.",
        "suggestion": "Guard with typeof checks or use TypeScript."
      }
    ],
    "strengths": ["Concise", "Pure function"]
  }
}
```

### `POST /api/review/github`
Review code from a GitHub URL (repo, pull request, or `blob` file URL).

**Request**
```json
{ "url": "https://github.com/owner/repo/pull/12" }
```

**Response**
```json
{
  "source": { "type": "pr", "owner": "owner", "repo": "repo", "number": "12" },
  "fileCount": 2,
  "reviews": [ { "filename": "src/app.js", "review": { /* ...as above... */ }, "savedId": "..." } ]
}
```

> If the request includes a valid `Authorization: Bearer <token>` header, each
> review is saved to the user's history and its `savedId` is returned.

### Auth endpoints

| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | `{ name, email, password }` | Create an account, returns `{ token, user }`. |
| `/api/auth/login` | POST | `{ email, password }` | Log in, returns `{ token, user }`. |
| `/api/auth/me` | GET | — (Bearer token) | Return the current user. |

### Review history (Bearer token required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/reviews` | GET | List the user's saved reviews. |
| `/api/reviews/:id` | GET | Fetch one full saved review. |
| `/api/reviews/:id` | DELETE | Delete a saved review. |

---

## 🧪 Testing

**43 automated tests** (34 backend, 9 frontend), all passing.

```bash
cd server && pytest        # 34 tests — pytest (unit + integration via TestClient)
cd client && npm test      # 9 tests  — vitest + React Testing Library
```

- **Backend unit:** prompt builder, GitHub URL parser, AI JSON parsing/normalising.
- **Backend integration:** API routes (validation, status codes, health, 404).
- **Auth/DB integration:** register, login, `me`, and history routes against an
  in-memory MongoDB (`mongomock`).
- **Frontend:** `ReviewResults` rendering and the API client (mocked fetch).
- **Manual / system:** open the app and run the bundled SQL-injection sample — the
  review should flag it as a security issue.

Full test matrix and manual/UAT cases: [docs/TEST_CASES.md](docs/TEST_CASES.md).

---

## ☁️ Deployment

**All on Vercel** (single project): the React app is served as static files and the
FastAPI backend runs as a **Python serverless function** under `/api` — same domain,
so no CORS and no `VITE_API_BASE`. Wired via [`vercel.json`](vercel.json),
[`api/index.py`](api/index.py), and the root [`requirements.txt`](requirements.txt).

1. Import the repo at https://vercel.com (keep Root Directory = repo root).
2. Add env vars: `GEMINI_API_KEY` (and `MONGODB_URI` from MongoDB Atlas for
   accounts/history). Do **not** set `VITE_API_BASE`.
3. Deploy → live URL.

📖 **Full step-by-step guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
*(An alternative Render-based backend setup via [`render.yaml`](render.yaml) is also included.)*

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/SRS.md](docs/SRS.md) | Software Requirement Specification — scope, users, functional & non-functional requirements, use cases. |
| [docs/DESIGN.md](docs/DESIGN.md) | System Design — architecture + UML diagrams (use case, activity, sequence, class, ER, DFD) and UI/UX notes. |
| [docs/TEST_CASES.md](docs/TEST_CASES.md) | Test cases & testing report (43 automated tests + manual/UAT cases). |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step deployment guide (Vercel + Render + MongoDB Atlas). |
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | AI usage log (prompts, tools, modifications). |

---

## 🤖 AI usage in development

This project was built with AI-assisted development (Claude Code). The prompt →
output → modification log is maintained in `docs/AI_USAGE.md` as required by the
course. Gemini is also the runtime AI engine that performs the reviews.

---

## 📜 License

Academic project — free to use for learning purposes.

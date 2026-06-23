# AI Code Review Assistant

An AI-powered web application that reviews source code and returns structured,
actionable feedback — bugs, security issues, performance problems, and style
suggestions — with a quality score per file. Built for the Software Engineering
individual project.

You can review code three ways:

1. **Paste** code into an in-browser editor (Monaco).
2. **Upload** a source file.
3. **Link a GitHub** repository, pull request, or single file URL.

The AI engine is **Google Gemini**, called from a small Express backend so the
API key never reaches the browser.

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
│   React client (Vite)   │        │   Express backend         │
│                         │  /api  │                           │
│  • Monaco code editor   │ ─────▶ │  POST /api/review         │ ──▶ Gemini API
│  • Paste / Upload / GH  │        │  POST /api/review/github  │ ──▶ GitHub REST API
│  • Results panel        │ ◀───── │  GET  /api/health         │
└─────────────────────────┘  JSON  └──────────────────────────┘
```

**Why a backend?** The Gemini API key must stay secret, and GitHub fetching needs
server-side requests. The React app holds no secrets.

### Tech stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 19, Vite, @monaco-editor/react, Context API   |
| Backend   | Node.js, Express, @google/generative-ai             |
| AI        | Google Gemini (`gemini-2.5-flash-lite` by default)  |
| Database  | MongoDB + Mongoose (in-memory fallback for dev)     |
| Auth      | JWT (jsonwebtoken) + bcrypt password hashing        |
| External  | GitHub REST API                                     |

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
├── server/                     # Express backend
│   ├── src/
│   │   ├── index.js           # app entry — connects DB, starts server
│   │   ├── app.js            # Express app factory (testable)
│   │   ├── db.js             # Mongo connection (URI or in-memory)
│   │   ├── models/           # Mongoose models: User, Review
│   │   ├── middleware/auth.js  # JWT auth + DB guards
│   │   ├── routes/
│   │   │   ├── review.js     # /api/review and /api/review/github
│   │   │   ├── auth.js       # /api/auth register / login / me
│   │   │   └── reviews.js    # /api/reviews history CRUD
│   │   ├── services/
│   │   │   ├── gemini.js     # Gemini call + JSON parsing/normalising
│   │   │   └── github.js     # fetch files from repo / PR / file URL
│   │   └── prompts/
│   │       └── reviewPrompt.js  # the code-review prompt + JSON shape
│   ├── tests/                 # node --test unit + integration suites
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting started

### Prerequisites

- Node.js 18+ (developed on Node 24)
- A free **Gemini API key** — https://aistudio.google.com/app/apikey

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then edit .env and paste your GEMINI_API_KEY
npm run dev                 # starts http://localhost:5000
```

> On Windows PowerShell, use `copy .env.example .env`.

### 2. Frontend

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
cd server && npm test     # 34 tests — node --test (unit + integration via supertest)
cd client && npm test     # 9 tests  — vitest + React Testing Library
```

- **Backend unit:** prompt builder, GitHub URL parser, AI JSON parsing/normalising.
- **Backend integration:** API routes (validation, status codes, health, 404).
- **Auth/DB integration:** register, login, `me`, and history routes against an
  in-memory MongoDB.
- **Frontend:** `ReviewResults` rendering and the API client (mocked fetch).
- **Manual / system:** open the app and run the bundled SQL-injection sample — the
  review should flag it as a security issue.

Full test matrix and manual/UAT cases: [docs/TEST_CASES.md](docs/TEST_CASES.md).

---

## ☁️ Deployment

- **Frontend** → Vercel or Netlify (`client/` as root, build `npm run build`,
  output `dist`). Set `VITE_API_BASE` to the backend URL.
- **Backend** → Render or Railway (`server/` as root, start `npm start`). Set
  `GEMINI_API_KEY` (and optionally `GITHUB_TOKEN`) in the dashboard.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/SRS.md](docs/SRS.md) | Software Requirement Specification — scope, users, functional & non-functional requirements, use cases. |
| [docs/DESIGN.md](docs/DESIGN.md) | System Design — architecture + UML diagrams (use case, activity, sequence, class, ER, DFD) and UI/UX notes. |
| [docs/TEST_CASES.md](docs/TEST_CASES.md) | Test cases & testing report (33 automated tests + manual/UAT cases). |
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | AI usage log (prompts, tools, modifications). |

---

## 🤖 AI usage in development

This project was built with AI-assisted development (Claude Code). The prompt →
output → modification log is maintained in `docs/AI_USAGE.md` as required by the
course. Gemini is also the runtime AI engine that performs the reviews.

---

## 📜 License

Academic project — free to use for learning purposes.

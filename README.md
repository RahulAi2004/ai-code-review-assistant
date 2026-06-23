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
- ⚡ **Fast & keyless frontend** — the backend proxies all AI calls.

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

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React 19, Vite, @monaco-editor/react, CSS    |
| Backend   | Node.js, Express, @google/generative-ai      |
| AI        | Google Gemini (`gemini-2.0-flash` by default)|
| External  | GitHub REST API                              |

---

## 📁 Folder structure

```
.
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api.js              # calls to the backend API
│   │   ├── App.jsx            # main UI: tabs, editor, run button
│   │   ├── App.css           # all component styles
│   │   └── components/
│   │       └── ReviewResults.jsx   # renders the structured review
│   ├── vite.config.js         # dev proxy /api -> :5000
│   └── .env.example
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── index.js           # app entry, health check, error handler
│   │   ├── routes/review.js   # /api/review and /api/review/github
│   │   ├── services/
│   │   │   ├── gemini.js      # Gemini call + JSON parsing/normalising
│   │   │   └── github.js      # fetch files from repo / PR / file URL
│   │   └── prompts/
│   │       └── reviewPrompt.js  # the code-review prompt + JSON shape
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
| `GEMINI_MODEL`   | ❌       | Gemini model id. Defaults to `gemini-2.0-flash`.                   |
| `PORT`           | ❌       | Backend port. Defaults to `5000`.                                  |
| `GITHUB_TOKEN`   | ❌       | GitHub PAT (`public_repo`) to raise the API rate limit to 5000/hr. |

### `client/.env` (optional)

| Variable        | Required | Description                                              |
|-----------------|----------|----------------------------------------------------------|
| `VITE_API_BASE` | ❌       | Deployed backend URL in production. Empty in dev (proxy).|

---

## 📡 API reference

### `GET /api/health`
Returns server status and whether the Gemini key is configured.

```json
{ "status": "ok", "geminiConfigured": true, "model": "gemini-2.0-flash" }
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
  "reviews": [ { "filename": "src/app.js", "review": { /* ...as above... */ } } ]
}
```

---

## 🧪 Testing

- **Manual / system test:** open the app, run the bundled vulnerable sample
  (a SQL-injection snippet) — the review should flag it as a security issue.
- **API test:** `GET http://localhost:5000/api/health` should return
  `geminiConfigured: true` once your key is set.
- See `docs/` for unit/integration test cases (added in a later phase).

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
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | AI usage log (prompts, tools, modifications). |

---

## 🤖 AI usage in development

This project was built with AI-assisted development (Claude Code). The prompt →
output → modification log is maintained in `docs/AI_USAGE.md` as required by the
course. Gemini is also the runtime AI engine that performs the reviews.

---

## 📜 License

Academic project — free to use for learning purposes.

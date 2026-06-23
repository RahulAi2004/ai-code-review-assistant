# System Design Document
### AI Code Review Assistant

| | |
|---|---|
| **Project** | AI Code Review Assistant |
| **Author** | Adyana Begum (22108150) |
| **Document version** | 1.0 |
| **Date** | 2026-06-23 |

This document presents the architecture and the mandatory UML diagrams. Diagrams
are written in **Mermaid**, which renders automatically on GitHub. The
`User`, `Review`, and `Issue` data entities described in the class and ER diagrams
are the **planned** persistence model for a later phase; the current build computes
reviews on demand without a database.

---

## Architecture Overview

```
┌──────────────────────────┐         ┌───────────────────────────┐
│      React Client        │  HTTP   │      Express Backend        │
│  (Vite + Monaco editor)  │ ──JSON─▶│                             │
│                          │         │  routes/review.js           │
│  • Paste / Upload / GH   │◀──JSON──│  services/gemini.js  ───────┼──▶ Gemini API
│  • Results panel         │         │  services/github.js  ───────┼──▶ GitHub API
└──────────────────────────┘         │  prompts/reviewPrompt.js    │
                                      └───────────────────────────┘
```

- **Presentation layer:** React components (`App.jsx`, `ReviewResults.jsx`).
- **API layer:** Express routes validating input and shaping responses.
- **Service layer:** `gemini.js` (AI review) and `github.js` (code fetching).
- **Prompt layer:** `reviewPrompt.js` defines the instruction and JSON contract.

---

## 1. Use Case Diagram

```mermaid
flowchart LR
    dev(("👤 Developer"))
    maint(("👤 Maintainer"))

    subgraph System["AI Code Review Assistant"]
        UC1["Paste code review"]
        UC2["Upload file review"]
        UC3["Review GitHub repo"]
        UC4["Review GitHub PR"]
        UC5["Select language"]
        UC6["View results & fixes"]
        UC7["Check service health"]
    end

    dev --- UC1
    dev --- UC2
    dev --- UC3
    dev --- UC4
    dev --- UC5
    dev --- UC6
    maint --- UC7

    gemini(("☁️ Gemini API"))
    github(("☁️ GitHub API"))
    UC1 --- gemini
    UC2 --- gemini
    UC3 --- github
    UC4 --- github
    UC3 --- gemini
    UC4 --- gemini
```

---

## 2. Activity Diagram — "Run a review"

```mermaid
flowchart TD
    A([Start]) --> B{Which input mode?}
    B -->|Paste| C[Read code from editor]
    B -->|Upload| D[Read file into editor] --> C
    B -->|GitHub URL| E[Parse GitHub URL]

    C --> F[POST /api/review]
    E --> G[POST /api/review/github]

    G --> H{URL type?}
    H -->|Repo| I[List default-branch source files, max 10]
    H -->|PR| J[List PR changed files]
    H -->|File| K[Fetch single file]
    I --> L[Fetch file contents]
    J --> L
    K --> L
    L --> M[Review each file with Gemini]

    F --> N[Review snippet with Gemini]

    M --> O[Parse & normalise AI JSON]
    N --> O
    O --> P{Success?}
    P -->|Yes| Q[Render summary, score, issues, strengths]
    P -->|No| R[Show error message]
    Q --> S([End])
    R --> S
```

---

## 3. Sequence Diagram — "Review a pasted snippet"

```mermaid
sequenceDiagram
    actor U as User
    participant C as React Client
    participant S as Express API
    participant G as Gemini API

    U->>C: Paste code, click "Review code"
    C->>S: POST /api/review { code, language, filename }
    S->>S: Validate body (code required)
    S->>G: generateContent(reviewPrompt)
    G-->>S: JSON review (text)
    S->>S: extractJson + normaliseReview
    S-->>C: { filename, review }
    C->>U: Render score, issues, strengths
```

### Sequence Diagram — "Review a GitHub pull request"

```mermaid
sequenceDiagram
    actor U as User
    participant C as React Client
    participant S as Express API
    participant H as GitHub API
    participant G as Gemini API

    U->>C: Paste PR URL, click "Review code"
    C->>S: POST /api/review/github { url }
    S->>S: parseGithubUrl(url) -> type: pr
    S->>H: GET pulls/:n/files
    H-->>S: changed files
    S->>H: GET file contents (head sha)
    H-->>S: file source
    loop each code file
        S->>G: generateContent(reviewPrompt)
        G-->>S: JSON review
    end
    S-->>C: { source, fileCount, reviews[] }
    C->>U: Render per-file reviews
```

---

## 4. Class Diagram

Models the backend modules (current build) plus the planned persistence entities.

```mermaid
classDiagram
    class ReviewController {
        +postReview(req, res)
        +postGithubReview(req, res)
    }
    class GeminiService {
        -apiKey
        -modelName
        +reviewCode(code, language, filename) Review
        -extractJson(text)
        -normaliseReview(raw)
    }
    class GithubService {
        +parseGithubUrl(url) Source
        +fetchGithubFiles(url) FileList
        -collectFromRepo()
        -collectFromPr()
        -collectFromFile()
    }
    class ReviewPrompt {
        +buildReviewPrompt(code, language, filename) String
        +REVIEW_JSON_SHAPE
    }

    class Review {
        +String summary
        +int score
        +String language
        +Issue[] issues
        +String[] strengths
    }
    class Issue {
        +String severity
        +String category
        +int line
        +String title
        +String description
        +String suggestion
    }
    class Source {
        +String type
        +String owner
        +String repo
        +String number
    }

    ReviewController --> GeminiService : uses
    ReviewController --> GithubService : uses
    GeminiService --> ReviewPrompt : uses
    GeminiService --> Review : returns
    Review "1" *-- "many" Issue : contains
    GithubService --> Source : returns

    class User {
        +String id
        +String name
        +String email
    }
    User "1" --> "many" Review : (planned) owns
```

---

## 5. ER Diagram (planned persistence model)

The current build is stateless. This is the schema planned for the database phase
(MongoDB collections / relational tables).

```mermaid
erDiagram
    USER ||--o{ REVIEW : submits
    REVIEW ||--o{ ISSUE : contains

    USER {
        string id PK
        string name
        string email
        datetime createdAt
    }
    REVIEW {
        string id PK
        string userId FK
        string source "paste | upload | github"
        string filename
        string language
        int score
        string summary
        datetime createdAt
    }
    ISSUE {
        string id PK
        string reviewId FK
        string severity
        string category
        int line
        string title
        string description
        string suggestion
    }
```

---

## 6. Data Flow Diagram

### Level 0 — Context diagram

```mermaid
flowchart LR
    U[User] -->|code / URL| P((AI Code Review Assistant))
    P -->|review results| U
    P -->|prompt| GM[Gemini API]
    GM -->|review JSON| P
    P -->|file requests| GH[GitHub API]
    GH -->|source files| P
```

### Level 1 — Decomposition

```mermaid
flowchart TD
    U[User]

    U -->|code / file / URL| P1[1.0 Collect Input]
    P1 -->|snippet| P2[2.0 Review Snippet]
    P1 -->|github url| P3[3.0 Fetch GitHub Files]
    P3 -->|source files| P2

    P2 -->|prompt| GM[Gemini API]
    GM -->|raw JSON| P2
    P3 -->|requests| GH[GitHub API]
    GH -->|files| P3

    P2 -->|normalised review| P4[4.0 Render Results]
    P4 -->|UI| U
```

---

## 7. UI / UX Design Notes

The interface is a single screen with a fixed two-panel layout:

```
┌───────────────────────────────────────────────────────────────┐
│  ⟨/⟩  AI Code Review Assistant                  Powered by Gemini│
├──────────────────────────────┬────────────────────────────────┤
│  [ Paste ][ Upload ][ GitHub ]│   Results                       │
│  Language: [ auto ▼ ]         │   ┌──────────────────────────┐  │
│  ┌──────────────────────────┐ │   │ 📄 file.js      Score 78 │  │
│  │  Monaco code editor      │ │   │ 2 high · 1 medium        │  │
│  │                          │ │   │ ─ Issue: SQL injection   │  │
│  └──────────────────────────┘ │   │   Suggested fix: ...     │  │
│  [        Review code       ] │   └──────────────────────────┘  │
└──────────────────────────────┴────────────────────────────────┘
```

**Design principles applied:**
- **Dark, developer-focused theme** with a gradient accent for primary actions.
- **Severity colour-coding** (critical = red → info = grey) so problems are
  scannable at a glance; each issue card has a coloured left border and badges.
- **Score ring** with a red→green hue mapped to the 0–100 score for instant signal.
- **Responsive:** the two-column grid collapses to a single column under 900 px.
- **Feedback states:** empty prompt, animated spinner during analysis, and inline
  error text on failure.

Recommended tools for high-fidelity mockups (course requirement): **Figma** for the
landing/dashboard screens and **Canva** for presentation visuals. The implemented
layout above can be used directly as the reference for those mockups.

---

## 8. Technology & Component Mapping

| Component | Responsibility | File |
|-----------|----------------|------|
| App shell | Tabs, editor, run action, state | `client/src/App.jsx` |
| Results renderer | Score, issues, strengths | `client/src/components/ReviewResults.jsx` |
| API client | HTTP calls to backend | `client/src/api.js` |
| Server entry | Express app, health, errors | `server/src/index.js` |
| Routes | Request validation & response shape | `server/src/routes/review.js` |
| AI service | Gemini call, JSON parsing | `server/src/services/gemini.js` |
| GitHub service | Fetch repo/PR/file source | `server/src/services/github.js` |
| Prompt | Review instruction + JSON contract | `server/src/prompts/reviewPrompt.js` |

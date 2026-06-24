# Deployment Guide (All on Vercel)

Deploys the **whole app to Vercel** as a single project:

- **Frontend (React/Vite)** → served as static files
- **Backend (FastAPI)** → a **Python serverless function** under `/api`
- **Database** → **MongoDB Atlas** (free) — required for accounts/history

Because frontend and backend share the same Vercel domain, there's **no CORS** and
**no `VITE_API_BASE`** to configure — the frontend just calls `/api/...`.

> The repo is already wired for this: [`vercel.json`](../vercel.json),
> [`api/index.py`](../api/index.py), and a root [`requirements.txt`](../requirements.txt).

---

## Step 1 — MongoDB Atlas (needed for login & history)

On Vercel each request is a fresh serverless invocation, so the in-memory dev DB
won't persist. To use **accounts and saved history**, set up a real database:

1. https://www.mongodb.com/atlas → sign up → **create a free M0 cluster**.
2. **Database Access** → add a user + password (save them).
3. **Network Access** → **Allow access from anywhere** (`0.0.0.0/0`).
4. **Connect → Drivers** → copy the connection string and insert your password:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/aicodereview?retryWrites=true&w=majority
   ```
   This is your **`MONGODB_URI`**.

> Skipping this? The **review feature still works**, but sign-up/login/history
> won't (no persistent DB). You can add `MONGODB_URI` later and redeploy.

---

## Step 2 — Deploy to Vercel

1. https://vercel.com → log in with **Continue with GitHub**.
2. **Add New… → Project** → import `ai-code-review-assistant`.
3. **Root Directory:** leave it as the repo root (**do not** change it to `client`).
   Vercel reads `vercel.json` and builds both the frontend and the Python API.
4. **Environment Variables** — add:
   | Key | Value |
   |-----|-------|
   | `GEMINI_API_KEY` | your Google Gemini key |
   | `MONGODB_URI` | the Atlas string from Step 1 *(optional — for accounts)* |
   | `GEMINI_MODEL` | `gemini-2.5-flash-lite` *(optional)* |
   | `JWT_SECRET` | any long random string *(optional but recommended)* |
   - ⚠️ **Do NOT set `VITE_API_BASE`** — leave it unset so the frontend calls the
     same-domain `/api`.
5. **Deploy.** You'll get a URL like `https://ai-code-review-assistant.vercel.app`.

---

## Step 3 — Verify

1. Open `https://YOUR-APP.vercel.app/api/health` → should show
   `{"status":"ok","geminiConfigured":true, ...}`.
2. Open the app URL, run the bundled SQL-injection sample → you should get a real
   AI review.
3. If you set `MONGODB_URI`: sign up, run a review, and it appears in **Your history**.

---

## Notes & caveats (Vercel serverless)

| Topic | Detail |
|-------|--------|
| **Cold starts** | The first request after idle may take a few seconds while the Python function spins up. |
| **Function timeout** | Vercel's Hobby plan limits function duration (~10s). Gemini `flash-lite` is fast, but a very large review could occasionally time out — retry. |
| **Accounts need Atlas** | Without `MONGODB_URI`, login/history won't persist across requests (serverless is stateless). Reviews still work. |
| **API docs** | Swagger UI is available at `/docs` on the deployed domain. |

---

## Alternative: backend on Render

If you prefer a always-on Python server (no cold starts, longer timeouts), the repo
also includes [`render.yaml`](../render.yaml) to host the backend on Render, with
the frontend on Vercel. In that case set `VITE_API_BASE` on Vercel to the Render
URL. See the git history of this file for the Render-based steps.

---

## Submission deliverables

| Deliverable | Where |
|-------------|-------|
| Live URL (web) | your Vercel URL |
| GitHub repository | https://github.com/RahulAi2004/ai-code-review-assistant |
| API docs | `https://YOUR-APP.vercel.app/docs` |

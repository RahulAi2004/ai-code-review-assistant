# Deployment Guide

Deploys the **AI Code Review Assistant** with:

- **Frontend (React)** → **Vercel**
- **Backend (FastAPI)** → **Render**
- **Database** → **MongoDB Atlas** (free tier)

Total cost: **$0** (all free tiers). Do the steps in order — the frontend needs the
backend URL, and the backend needs the database URL.

---

## Step 1 — MongoDB Atlas (database)

1. Go to https://www.mongodb.com/atlas → sign up / log in.
2. **Create a free cluster** (M0, any cloud/region).
3. **Database Access** → *Add New Database User* → create a username + password
   (save them).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   (`0.0.0.0/0`) — Render's IPs are dynamic.
5. **Clusters → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<user>` and `<password>` with the credentials from step 3. Add a
   database name before the `?` if you like, e.g. `.../aicodereview?retryWrites...`.

Keep this string — it's your `MONGODB_URI`.

---

## Step 2 — Render (backend / FastAPI)

The repo includes [`render.yaml`](../render.yaml), so Render can auto-configure.

1. Go to https://render.com → sign up / log in (use **Sign in with GitHub**).
2. **New + → Blueprint** → select the `ai-code-review-assistant` repo → **Apply**.
   Render reads `render.yaml` and creates the `ai-code-review-api` web service.
3. Open the service → **Environment** → add the secret variables:
   | Key | Value |
   |-----|-------|
   | `GEMINI_API_KEY` | your Google Gemini key |
   | `MONGODB_URI` | the Atlas string from Step 1 |
   | `GITHUB_TOKEN` | *(optional — leave blank)* |
   *(`JWT_SECRET`, `GEMINI_MODEL`, `PYTHON_VERSION` are set automatically.)*
4. **Save** → Render builds and deploys. When it's live you get a URL like:
   ```
   https://ai-code-review-api.onrender.com
   ```
5. Verify: open `https://<your-render-url>/api/health` → should show
   `{"status":"ok","geminiConfigured":true,"dbConnected":true}`.

> **Don't have a Blueprint option?** Create a **New Web Service** manually:
> Root Directory `server`, Build `pip install -r requirements.txt`,
> Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and add all env vars.

> ⏳ Render's free tier **sleeps after ~15 min idle**; the first request after that
> takes ~50s to wake. Fine for a demo.

---

## Step 3 — Vercel (frontend / React)

1. Go to https://vercel.com → sign up / log in (use **Continue with GitHub**).
2. **Add New… → Project** → import the `ai-code-review-assistant` repo.
3. **Configure the project:**
   - **Root Directory:** click *Edit* → select **`client`**
   - Framework Preset: **Vite** (auto-detected)
   - Build/Output: auto (`npm run build` → `dist`)
4. **Environment Variables** → add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE` | your Render backend URL, e.g. `https://ai-code-review-api.onrender.com` |
   *(No trailing slash.)*
5. **Deploy.** You get a URL like `https://ai-code-review-assistant.vercel.app`.

> `VITE_API_BASE` is read at **build time**. If you change it later, **redeploy**
> the frontend so the new value is baked in.

---

## Step 4 — Verify the live app

1. Open your Vercel URL.
2. **Sign up**, then run a review (the bundled SQL-injection sample) — you should
   get a real AI review, and it should appear in **Your history**.
3. If reviews fail, check the Render service **Logs** and confirm `GEMINI_API_KEY`
   and `MONGODB_URI` are set.

---

## Submission deliverables

| Deliverable | Where |
|-------------|-------|
| Live URL (web) | your Vercel URL |
| GitHub repository | https://github.com/RahulAi2004/ai-code-review-assistant |
| Backend API | your Render URL (+ `/docs` for Swagger) |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `dbConnected: false` on `/api/health` | `MONGODB_URI` wrong, or Atlas Network Access doesn't allow `0.0.0.0/0`. |
| Reviews error with 500 | `GEMINI_API_KEY` missing/invalid on Render, or Gemini quota — check Render logs. |
| Frontend can't reach API (CORS/404) | `VITE_API_BASE` not set or has a typo / trailing slash; redeploy frontend after fixing. |
| First request very slow | Render free tier cold start (~50s). Subsequent requests are fast. |

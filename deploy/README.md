# Deploy on your own server (DigitalOcean / any Ubuntu VPS)

Hosts the **whole app** (React frontend + FastAPI backend + nginx) on one Ubuntu
server. Tested on Ubuntu 22.04 / 24.04.

```
Internet → nginx (port 80)
   ├── /        → React build (static files)
   └── /api/*   → FastAPI (uvicorn :5000, via systemd) → Gemini + MongoDB
```

---

## Quick start (run on the server as root)

SSH into your droplet (or use the DigitalOcean **Web Console**):

```bash
ssh root@YOUR_SERVER_IP
```

Then run:

```bash
# 1. Get the code
git clone https://github.com/RahulAi2004/ai-code-review-assistant.git /opt/ai-code-review

# 2. Run the setup script (installs everything, builds, starts services)
sudo bash /opt/ai-code-review/deploy/setup.sh

# 3. Add your Gemini API key (and optionally a MongoDB URI)
nano /opt/ai-code-review/server/.env
#    set GEMINI_API_KEY=...   (and MONGODB_URI=... if you want accounts/history)

# 4. Restart the backend so it picks up the key
systemctl restart aicodereview
```

Open **http://YOUR_SERVER_IP/** — the app is live. 🎉

---

## Environment variables (`/opt/ai-code-review/server/.env`)

| Variable | Needed | Notes |
|----------|--------|-------|
| `GEMINI_API_KEY` | ✅ | for the AI reviews |
| `MONGODB_URI` | optional | for **accounts + saved history**. Without it, reviews still work (guest mode). |
| `JWT_SECRET` | recommended | any long random string |
| `GEMINI_MODEL` | optional | defaults to `gemini-2.5-flash-lite` |

### Want accounts/history? Pick one for `MONGODB_URI`:

**A) MongoDB Atlas (free, no install — recommended for a 2 GB droplet):**
Create a free cluster at https://www.mongodb.com/atlas, allow access from
anywhere, and use its connection string.

**B) Install MongoDB locally on the droplet:**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update && apt-get install -y mongodb-org
systemctl enable --now mongod
```
then set `MONGODB_URI=mongodb://localhost:27017/aicodereview` in `.env` and
`systemctl restart aicodereview`.

---

## Updating after you push new code

```bash
cd /opt/ai-code-review
git pull
server/.venv/bin/pip install -r server/requirements.txt    # if backend deps changed
( cd client && npm install && npm run build )              # rebuild frontend
systemctl restart aicodereview
systemctl reload nginx
```

---

## Useful commands

```bash
systemctl status aicodereview      # is the backend running?
journalctl -u aicodereview -f      # live backend logs
nginx -t && systemctl reload nginx # test + reload nginx
curl http://localhost:5000/api/health   # backend health (on the server)
```

---

## Add a domain + HTTPS (optional)

Point a domain's A-record to the server IP, then:
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```
Certbot edits the nginx config and installs a free Let's Encrypt certificate.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `502 Bad Gateway` | Backend not running: `systemctl status aicodereview`, then `journalctl -u aicodereview -e`. |
| Reviews fail | `GEMINI_API_KEY` not set or invalid in `.env` → fix → `systemctl restart aicodereview`. |
| Can't open the site | Check a DigitalOcean **cloud firewall** allows inbound port 80/443. |
| Frontend build killed (OOM) | The script adds 2 GB swap; if it still fails, build locally and copy `client/dist` up. |

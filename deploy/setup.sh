#!/usr/bin/env bash
#
# One-shot deploy for the AI Code Review Assistant on an Ubuntu 22.04/24.04 server.
# Run as root:  sudo bash deploy/setup.sh   (from inside the cloned repo)
#
set -euo pipefail

APP_DIR="/opt/ai-code-review"
REPO="https://github.com/RahulAi2004/ai-code-review-assistant.git"

echo "==> [1/8] Adding 2G swap (helps the frontend build on small droplets)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

echo "==> [2/8] Installing system packages (python, nginx, git)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y python3 python3-venv python3-pip nginx git curl

echo "==> [3/8] Installing Node.js 22 (needed for the Vite build)"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> [4/8] Cloning / updating the repository at ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull --ff-only
else
  git clone "${REPO}" "${APP_DIR}"
fi

echo "==> [5/8] Backend: Python virtualenv + dependencies"
cd "${APP_DIR}/server"
python3 -m venv .venv
.venv/bin/pip install --upgrade pip --quiet
.venv/bin/pip install -r requirements.txt --quiet
if [ ! -f "${APP_DIR}/server/.env" ]; then
  cp "${APP_DIR}/server/.env.example" "${APP_DIR}/server/.env"
  echo "    !! Created server/.env from template — you MUST edit it to add GEMINI_API_KEY."
fi

echo "==> [6/8] Frontend: install + build (Vite -> client/dist)"
cd "${APP_DIR}/client"
npm install --no-audit --no-fund
npm run build

echo "==> [7/8] systemd service for the FastAPI server"
cp "${APP_DIR}/deploy/aicodereview.service" /etc/systemd/system/aicodereview.service
systemctl daemon-reload
systemctl enable aicodereview >/dev/null 2>&1 || true
systemctl restart aicodereview

echo "==> [8/8] nginx reverse proxy + static frontend"
cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/aicodereview
ln -sf /etc/nginx/sites-available/aicodereview /etc/nginx/sites-enabled/aicodereview
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Open the firewall if ufw is in use (no-op if inactive).
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw allow OpenSSH >/dev/null 2>&1 || true

IP="$(curl -s ifconfig.me || echo '<your-server-ip>')"
echo ""
echo "============================================================"
echo " Done!  App should be live at:  http://${IP}/"
echo ""
echo " IMPORTANT — add your API key, then restart the backend:"
echo "   nano ${APP_DIR}/server/.env      # set GEMINI_API_KEY (and MONGODB_URI for accounts)"
echo "   systemctl restart aicodereview"
echo "============================================================"

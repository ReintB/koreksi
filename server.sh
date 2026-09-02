#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"
DATA="$ROOT/data"
FRONTEND_PORT=9100
BACKEND_PORT=9101
FRONTEND_NAME="koreksi-frontend"
BACKEND_NAME="koreksi-backend"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok(){ echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}⚠${NC} $*"; }
err(){ echo -e "${RED}✗${NC} $*"; }

need(){ command -v "$1" >/dev/null 2>&1 || { err "$1 tidak ditemukan"; exit 1; }; }
mkdir -p "$DATA" "$ROOT/log/frontend" "$ROOT/log/backend"

wait_url(){
  local url="$1" label="$2"
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then ok "$label sehat: $url"; return 0; fi
    sleep 1
  done
  err "$label tidak sehat: $url"; return 1
}

build_all(){
  need python3; need npm; need curl
  echo "== Backend check =="
  [ -x "$BACKEND/.venv/bin/python" ] || { err "Virtualenv backend belum ada"; exit 1; }
  cd "$BACKEND"
  "$BACKEND/.venv/bin/python" -m pip install -q -r requirements.txt
  "$BACKEND/.venv/bin/python" -m py_compile app/*.py app/services/*.py
  "$BACKEND/.venv/bin/python" -m app.seed
  ok "Backend Python + PostgreSQL seed PASS"

  echo "== Frontend build =="
  cd "$FRONTEND"
  npm ci
  npm run lint
  npm run build
  ok "Frontend Next.js production build PASS"
}

stop_all(){
  pm2 delete "$FRONTEND_NAME" >/dev/null 2>&1 || true
  pm2 delete "$BACKEND_NAME" >/dev/null 2>&1 || true
  ok "Service Koreksi dihentikan"
}

start_all(){
  need pm2; need curl
  [ -d "$FRONTEND/.next" ] || { warn "Build frontend belum ada, menjalankan build"; build_all; }
  stop_all >/dev/null

  cd "$BACKEND"
  pm2 start "$BACKEND/.venv/bin/python" \
    --name "$BACKEND_NAME" \
    --cwd "$BACKEND" \
    --output "$ROOT/log/backend/out.log" \
    --error "$ROOT/log/backend/error.log" \
    -- -m uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT"

  cd "$FRONTEND"
  pm2 start npm \
    --name "$FRONTEND_NAME" \
    --cwd "$FRONTEND" \
    --output "$ROOT/log/frontend/out.log" \
    --error "$ROOT/log/frontend/error.log" \
    -- start -- -H 0.0.0.0 -p "$FRONTEND_PORT"

  wait_url "http://127.0.0.1:$BACKEND_PORT/api/health" "Backend"
  wait_url "http://127.0.0.1:$FRONTEND_PORT/" "Frontend"
  pm2 save >/dev/null
  ok "PM2 tersimpan. Frontend :$FRONTEND_PORT, backend :$BACKEND_PORT"
}

status_all(){
  echo "== PM2 =="
  pm2 status | grep -E "koreksi-|App name|id|─" || pm2 status
  echo "== Port =="
  ss -ltnp | grep -E ":${FRONTEND_PORT}|:${BACKEND_PORT}" || true
  echo "== Health =="
  curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" || true
  echo
  curl -sS -o /dev/null -w "frontend_http=%{http_code}\n" "http://127.0.0.1:$FRONTEND_PORT/" || true
}

case "${1:-status}" in
  1|start) start_all ;;
  2|build) build_all ;;
  3|stop) stop_all ;;
  4|status) status_all ;;
  restart) stop_all; start_all ;;
  logs) pm2 logs "$BACKEND_NAME" "$FRONTEND_NAME" --lines 100 ;;
  *) echo "Usage: $0 {1|start|2|build|3|stop|4|status|restart|logs}"; exit 2 ;;
esac

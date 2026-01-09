#!/usr/bin/env bash

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_BIN="${PYTHON_BIN:-}"
PYTHON_ARGS=()

if [ -f "$BASE_DIR/.env" ]; then
  set -a
  . "$BASE_DIR/.env"
  set +a
fi

if [ -x "$BASE_DIR/.venv/bin/python" ]; then
  PYTHON_BIN="$BASE_DIR/.venv/bin/python"
elif [ -x "$BASE_DIR/.venv/Scripts/python.exe" ]; then
  PYTHON_BIN="$BASE_DIR/.venv/Scripts/python.exe"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3)"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python)"
elif command -v py >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v py)"
  PYTHON_ARGS=(-3)
fi

if [ -z "$PYTHON_BIN" ]; then
  echo "ERROR - Python no encontrado (python3/python/py)" >&2
  exit 2
fi

ORIGIN_IP="15.235.72.8"
HOST="intramax.bo"
ENDPOINT="/api/search-agents?q=lk"

HEALTH_URL="https://$HOST$ENDPOINT"
HEALTH_BASE_URL="https://$HOST"
export STATUS HEALTH_URL HEALTH_BASE_URL

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Host: $HOST" \
  "https://$ORIGIN_IP$ENDPOINT" \
  --insecure \
  --connect-timeout 2 \
  --max-time 5)

if [ "$STATUS" -eq 200 ]; then
  echo "OK - Intramax backend healthy"
  "$PYTHON_BIN" "${PYTHON_ARGS[@]}" - <<'PY'
import asyncio
import os
from notify import notify_test_success

async def main():
    await notify_test_success(project_name="Intramax", base_url=os.environ.get("HEALTH_BASE_URL"))

asyncio.run(main())
PY
  exit 0
else
  echo "CRITICAL - Intramax backend unhealthy (HTTP $STATUS)"
  "$PYTHON_BIN" "${PYTHON_ARGS[@]}" - <<'PY'
import asyncio
import os
from notify import notify_test_failure

async def main():
    status = os.environ.get("STATUS", "unknown")
    current_url = os.environ.get("HEALTH_URL", "")
    base_url = os.environ.get("HEALTH_BASE_URL")
    await notify_test_failure(
        "Backend health check",
        f"HTTP {status}",
        current_url,
        None,
        project_name="Intramax",
        base_url=base_url,
    )

asyncio.run(main())
PY
  exit 1
fi

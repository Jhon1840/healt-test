
#!/usr/bin/env bash

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="$BASE_DIR/.venv/bin/python"

cd "$BASE_DIR" || exit 1

"$PYTHON" check_availability.py >/dev/null 2>&1


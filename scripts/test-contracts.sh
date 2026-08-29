#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -x "$PROJECT_ROOT/.tools/bin/snforge" ]]; then
  export UNIVERSAL_SIERRA_COMPILER="$PROJECT_ROOT/.tools/bin/universal-sierra-compiler"
  exec "$PROJECT_ROOT/.tools/bin/snforge" test
fi

if ! command -v snforge >/dev/null 2>&1; then
  echo "snforge is required. Install Starknet Foundry 0.63.0." >&2
  exit 1
fi

exec snforge test

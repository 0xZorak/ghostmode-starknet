#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_MAINNET_DEPLOYMENT:-}" != "true" ]]; then
  echo "MAINNET DEPLOYMENT BLOCKED: set CONFIRM_MAINNET_DEPLOYMENT=true only after reviewing docs/MAINNET.md." >&2
  exit 2
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNCAST="${SNCAST_BIN:-$PROJECT_ROOT/.tools/bin/sncast}"
ACCOUNTS_FILE="${SNCAST_ACCOUNTS_FILE:-$PROJECT_ROOT/.secrets/sncast-accounts.json}"
ACCOUNT_NAME="${SNCAST_MAINNET_ACCOUNT_NAME:-ghostmode_mainnet_deployer}"
MAINNET_POOL="0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a"

if [[ -z "${GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY:-}" ]]; then
  echo "GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY is required. No transaction was submitted." >&2
  exit 2
fi

if [[ ! -x "$SNCAST" ]]; then
  echo "Missing sncast at $SNCAST" >&2
  exit 1
fi
if [[ ! -f "$ACCOUNTS_FILE" ]]; then
  echo "Missing gitignored sncast account file. No transaction was submitted." >&2
  exit 1
fi

echo "MAINNET — REAL FUNDS. Deploying ReceiptGate only; no token transfer or shielding is performed."
cd "$PROJECT_ROOT/cairo"
"$SNCAST" \
  --accounts-file "$ACCOUNTS_FILE" \
  --account "$ACCOUNT_NAME" \
  --wait \
  --scarb-profile release \
  deploy \
  --network mainnet \
  --contract-name ReceiptGate \
  --constructor-calldata "$MAINNET_POOL" "$GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY" \
  --unique

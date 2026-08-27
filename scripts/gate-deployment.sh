#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNCAST="$PROJECT_ROOT/.tools/bin/sncast"
USC="$PROJECT_ROOT/.tools/bin/universal-sierra-compiler"
ACCOUNTS_FILE="$PROJECT_ROOT/.secrets/sncast-accounts.json"
ACCOUNT_NAME="ghostmode_deployer"
SEPOLIA_POOL="0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91"

if [[ ! -x "$SNCAST" ]]; then
  echo "Missing .tools/bin/sncast. Install Starknet Foundry v0.63.0 before deploying." >&2
  exit 1
fi

if [[ ! -x "$USC" ]]; then
  echo "Missing .tools/bin/universal-sierra-compiler. Install the official compiler before deploying." >&2
  exit 1
fi

export UNIVERSAL_SIERRA_COMPILER="$USC"

mkdir -p "$PROJECT_ROOT/.secrets"

case "${1:-}" in
  create-account)
    "$SNCAST" --accounts-file "$ACCOUNTS_FILE" account create \
      --network sepolia \
      --name "$ACCOUNT_NAME" \
      --type open-zeppelin
    echo "Fund the printed address with Sepolia STRK, then run: npm run gate:account:deploy"
    ;;
  deploy-account)
    "$SNCAST" --accounts-file "$ACCOUNTS_FILE" --wait account deploy \
      --network sepolia \
      --name "$ACCOUNT_NAME" \
      --silent
    ;;
  deploy-gate)
    if [[ -z "${GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY:-}" ]]; then
      echo "GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY is required as ReceiptGate constructor argument 2." >&2
      exit 2
    fi
    cd "$PROJECT_ROOT/cairo"
    "$SNCAST" \
      --accounts-file "$ACCOUNTS_FILE" \
      --account "$ACCOUNT_NAME" \
      --wait \
      --scarb-profile dev \
      deploy \
      --network sepolia \
      --contract-name ReceiptGate \
      --constructor-calldata "$SEPOLIA_POOL" "$GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY" \
      --unique
    ;;
  *)
    echo "Usage: $0 {create-account|deploy-account|deploy-gate}" >&2
    exit 2
    ;;
esac

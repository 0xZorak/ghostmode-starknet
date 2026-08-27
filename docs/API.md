# API

All responses use JSON and `Cache-Control: no-store`. Inputs are treated as hostile.

## `POST /api/privacy/evaluate`

Validates a privacy intent and returns `{ evaluation, score }`. `200` means the requested route is supported; `422` means the policy engine intentionally refused it; `400` means malformed input.

## `GET /api/demo-intel`

Returns HTTP `402 Payment Required` with a signed demo quote. The quote signer must be configured and match the ReceiptGate public key. No resource bytes are returned.

## `POST /api/payment/verify`

Body: `{ "requestId": "0x...", "transactionHash": "0x..." }`. Verifies the exact gate event, calls the authenticated seller verifier, atomically marks the process-local quote released, and returns the resource once. Repeated or concurrent claims return `409`.

`POST /api/demo-intel/unlock` is the demo-compatible alias and also accepts legacy `quoteId`.

## `GET /api/payment/:id`

Returns public state only: request ID, status, network, expiry, transaction hash if submitted, and verification time. It never returns the resource or private note contents.

## `GET /api/health`

Checks RPC chain ID, privacy pool class, ReceiptGate class, its quote-authority binding, and seller verifier reachability. It exposes status labels only—no URLs, tokens, keys, or note data.

## `GET /api/chain-evidence` and `/api/readiness`

These power public deposit recovery and the workbench status display. Chain evidence is public blockchain data and is not presented as a shielded balance.

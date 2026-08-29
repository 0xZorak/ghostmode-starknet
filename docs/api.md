# HTTP API

All implemented routes return JSON and set `Cache-Control: no-store` where the response may contain live state. There is no public user-authentication layer in the prototype; do not expose resource routes as production APIs without one.

## `POST /api/privacy/evaluate`

Evaluates a privacy intent. It does not contact a wallet or submit.

```json
{
  "action": "payment",
  "network": "starknet-sepolia",
  "token": "0x4718",
  "amount": "100",
  "requirements": {
    "hideSender": true,
    "hideRecipient": true,
    "hideAmount": true,
    "hideToken": true
  },
  "capabilities": {
    "privacyWallet": true,
    "privateInvoke": true,
    "recipientRegistered": true
  }
}
```

Responses:

- `200 { evaluation, score }`: supported, including explicitly public requests with no privacy requirements.
- `400 { error: "INVALID_JSON" }`: malformed JSON.
- `400 { error: "INVALID_PRIVACY_INTENT" }`: missing/invalid action, network, token, amount, or booleans.
- `422 { evaluation, score }`: valid intent refused by privacy policy.

## `GET /api/demo-intel`

Creates an in-memory protected resource and a fresh 15-minute signed quote.

Success is intentionally HTTP `402`:

```json
{
  "error": "payment_required",
  "message": "This resource requires a private STRK20 payment.",
  "quote": { "version": "ghostmode-x402/0.1" }
}
```

The full quote also appears as Base64URL JSON in the `Payment-Required` response header. `503` returns `{ error, message }` when the quote signer is missing/mismatched. If gate/seller values are zero, the route can produce a structurally valid analysis quote but the UI refuses execution.

## `POST /api/payment/verify`

Verifies fulfillment and releases the stored resource. `/api/demo-intel/unlock` is the same handler and also accepts legacy `quoteId`.

```json
{
  "requestId": "0x...",
  "transactionHash": "0x..."
}
```

Success `200`:

```json
{
  "paid": true,
  "gate": {
    "accepted": true,
    "executionStatus": "SUCCEEDED",
    "finalityStatus": "ACCEPTED_ON_L2"
  },
  "seller": { "verified": true, "noteId": "0x..." },
  "resourceCommitment": "0x...",
  "resourceReleased": true,
  "resource": {}
}
```

Errors:

| Status | Error | Funds/retry meaning |
|---:|---|---|
| 400 | `invalid_json` | No verification performed; payment state unchanged. |
| 400 | `requestId_and_transactionHash_are_required` | No verification performed. |
| 404 | `quote_not_found_or_expired` | Store has no record; do not infer whether a chain payment exists. |
| 409 | `PAYMENT_ALREADY_USED` | Resource already verified/released; do not pay again. |
| 409 | `PAYMENT_VERIFICATION_IN_PROGRESS` | Another hash owns the in-process claim; poll status. |
| 409 | seller reason such as `seller_note_not_found` or `ambiguous_seller_note` | Gate may be accepted and funds may have moved; retry verification or resolve, never repay automatically. |
| 422 | `receipt_gate_not_verified` | Supplied receipt did not prove the exact gate/request/commitment. Check the transaction before any retry. |
| 502 | `verification_failed` | Chain receipt could not be verified; outcome uncertain. |

## `GET /api/payment/:id`

Returns only public fulfillment state:

```json
{
  "requestId": "0x...",
  "status": "pending",
  "network": "sepolia",
  "expiresAt": 0,
  "transactionHash": "0x...",
  "verifiedAt": "2026-08-29T00:00:00.000Z"
}
```

Optional fields are omitted until known. `404 PAYMENT_NOT_FOUND_OR_EXPIRED` means the in-memory store has no record.

## `GET /api/health`

Checks selected RPC chain ID, pool class, gate class, onchain authority binding, and seller-verifier health.

```json
{
  "app": "ok",
  "network": "sepolia",
  "rpc": "ok",
  "privacy": "ok",
  "receiptContract": "not_configured",
  "receiptAuthorization": "not_configured",
  "sellerVerifier": "not_configured",
  "ready": false
}
```

Returns `200` when RPC and pool are reachable, even if the full purchase is not ready. Returns `503` when that basic chain health fails. No URL, token, key, or note is returned.

## `GET /api/readiness`

Reports configuration layers:

- `readyForShieldTesting`: currently always `true`; wallet/network/funds are still runtime requirements.
- `readyForPrivatePurchaseTesting`: gate, seller, and quote authority are configured and match onchain.
- `readyForResourceUnlockTesting`: purchase readiness plus seller-verifier URL/token.

It also reports `quoteStore: "ephemeral-local"`.

## `GET /api/chain-evidence`

Reads public STRK balance and public pool `Deposit` events for recovery. This is not a shielded-balance endpoint.

Query:

```text
/api/chain-evidence?address=0x...&fromBlock=123
```

`address` is required. `fromBlock` defaults to the latest 20,000 blocks and is clamped to at most 100,000 blocks of lookback.

Responses:

- `200 { latestBlock, publicStrk, deposits, totalDeposited }`
- `400 { error: "address is required" }`
- `400 { error: "invalid Starknet address" }`
- `502 { error }` for an RPC/event query failure

## Seller verifier API

The isolated service listens on `127.0.0.1` by default.

### `GET /health`

Returns `200 { ok: true, network: "SN_SEPOLIA", viewingOnly: true }`. The `viewingOnly` label describes the endpoint output; the process currently also holds an account signer required by its SDK setup.

### `POST /verify-note`

Requires `Authorization: Bearer <token>` and a JSON body with quote/request ID, transaction hash, seller, token, amount, and `network: "sepolia"`.

Possible reasons include `invalid_request`, `invalid_felt`, `wrong_seller`, `transaction_not_accepted`, `seller_note_not_found`, `ambiguous_seller_note`, `unauthorized`, and `verification_unavailable`.

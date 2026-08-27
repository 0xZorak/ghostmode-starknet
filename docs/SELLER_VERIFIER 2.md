# Seller private-note verifier

GhostMode never asks the browser for the seller's viewing key. Resource delivery delegates private-note discovery to a seller-operated HTTPS service.

## Request

GhostMode sends a server-to-server `POST` with `Authorization: Bearer <GHOSTMODE_SELLER_VERIFIER_TOKEN>` and this JSON body:

```json
{
  "quoteId": "0x...",
  "transactionHash": "0x...",
  "seller": "0x...",
  "token": "0x...",
  "amount": "100000000000000000",
  "network": "sepolia"
}
```

## Successful response

Return HTTP 200 only after the seller's Privacy SDK discovery process has found an unspent incoming note matching the registered seller, token and amount, and has correlated it with the purchase attempt:

```json
{
  "verified": true,
  "noteId": "opaque-seller-side-note-id"
}
```

For a missing, immature or mismatched note, return `{"verified": false, "reason": "seller_note_not_found"}`. GhostMode keeps the resource locked.

## Required controls

- Keep the seller signing key, viewing key and bearer token out of the frontend and logs.
- Authenticate every request and use TLS.
- Make verification idempotent by quote ID and transaction hash.
- Verify network, seller, token and amount; a ReceiptGate event by itself is insufficient.
- Store the quote and delivery record durably before production deployment.
- Rate-limit failed lookups and never return decrypted notes to GhostMode.

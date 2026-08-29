# Private payments

GhostMode's flagship payment flow is an application protocol built on STRK20. It uses HTTP status `402`, but its quote schema is a project protocol (`ghostmode-http402/0.2`), not a claim of formal x402 interoperability.

## Participants

- **Agent/buyer:** requests a resource and asks for confidentiality.
- **GhostMode server:** creates and stores the quote/resource, verifies fulfillment, and releases once.
- **Privacy wallet:** holds buyer keys, discovers notes, creates proofs, and submits.
- **STRK20 pool:** executes the encrypted transfer and one helper invoke atomically.
- **ReceiptGate:** validates seller authorization, expiry, pool caller, and replay state.
- **Seller verifier:** discovers the exact incoming seller note.

## Quote shape

```json
{
  "version": "ghostmode-http402/0.2",
  "network": "sepolia",
  "chainId": "SN_SEPOLIA",
  "quoteId": "0x...",
  "resourceCommitment": "0x...",
  "seller": "0x...",
  "gate": "0x...",
  "token": "0x...",
  "amount": "100000000000000000",
  "validUntil": 0,
  "authorization": {
    "scheme": "stark-curve",
    "r": "0x...",
    "s": "0x..."
  },
  "resource": {
    "name": "Starknet threat-intelligence snapshot",
    "mediaType": "application/vnd.ghostmode.threat-report+json",
    "preview": "24 signed indicators · generated for this request"
  },
  "proof": {
    "type": "commitment",
    "statement": "Resource bytes must match resourceCommitment. Semantic quality is not claimed."
  }
}
```

`validUntil` is a future Unix timestamp in a real response. Placeholders above are intentionally non-executable.

## Onchain action pair

```ts
const actions = [
  { type: "transfer", token, amount, recipient: seller },
  {
    type: "invoke",
    contract: gate,
    calldata: [
      "${poolAddress}",
      quoteId,
      resourceCommitment,
      validUntil,
      authorizationR,
      authorizationS,
    ],
  },
];
```

The transfer creates a normal encrypted seller note. ReceiptGate returns an empty `Span<OpenNoteDeposit>` because no asset flows back from the helper. If authorization, expiry, replay, or caller validation fails, the pool transaction reverts atomically.

## Verification and release

1. Root server fetches the transaction receipt.
2. It requires `execution_status === SUCCEEDED`.
3. It finds `ReceiptAccepted` from the exact configured gate, keyed by the exact quote ID and carrying the exact resource commitment.
4. It calls the seller verifier with bearer authentication.
5. The verifier checks the configured seller and accepted block, discovers notes for the expected token, and requires exactly one note with the expected amount created in that block.
6. The quote store atomically changes the in-process record from `submitted` to `released` and returns the resource.

The verifier does not currently prove that an encrypted note contains the quote ID. Equal same-amount notes in the same block are ambiguous and fail closed.

## Status lifecycle

```text
pending → submitted → released
             ↓
      verification failure
             ↓
           pending
```

Expired records are deleted. A duplicate quote ID is rejected. `verified` and `rejected` exist in the shared type but are not currently persisted by the quote store.

## Retry safety

- Before a hash or timeout: a user rejection is safe; no payment was submitted by GhostMode.
- Wallet timeout without a hash: uncertain. Check wallet Activity and gate/deposit recovery before retrying.
- Hash returned but RPC confirmation times out: assume submitted; track the hash and do not resubmit.
- Gate accepted but seller discovery lags: payment may have moved; retry verification, not payment.
- Quote consumed/released: never pay it again; request a new quote for a new purchase.

See [troubleshooting](troubleshooting.md) for exact error guidance.

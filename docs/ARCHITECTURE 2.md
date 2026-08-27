# GhostMode architecture

## Product boundary

GhostMode is an agent-facing policy and routing layer. It is not a new privacy pool, wallet, relayer, prover or anonymity network. STRK20 supplies the note system and proof-backed private execution.

The first supported intent is `purchase`: an agent receives a structured HTTP 402 quote and decides whether to execute the payment publicly, privately, or not at all.

GhostMode also compiles the inspected quote into `ghostmode-adapter.json`. This is a declarative deployment manifest—not generated unaudited Cairo. It records the exact network, Wallet API floor, atomic actions, ReceiptGate template, guarantees, limitations and hidden-versus-visible boundary.

The broader compatibility compiler accepts a Starknet action description and emits `ghostmode-compatibility.json`. Its decision is deterministic: direct private transfer, an existing supported private route, one reviewed anonymizer helper, or unsupported. It never treats public contract storage or arbitrary calldata as confidential.

## Components

### Planner

`src/lib/ghostmode/planner.ts` converts an agent action into an explicit exposure report. The report distinguishes public observers from the counterparty. This avoids calling an HTTP request “private” merely because its payment is shielded.

### Compatibility compiler

`src/lib/ghostmode/compatibility.ts` converts declared integration constraints into an auditable route decision. It enforces the single-external-invoke budget, explains open-note visibility, prefers the supported AVNU private-swap route, and rejects privacy requirements STRK20 cannot meet. The output is a planning and review artifact, not an audit or deployment approval.

### Quote endpoint

`GET /api/demo-intel` returns status 402 and a base64url `Payment-Required` header. Its JSON body includes the same typed quote for clients that do not read the header.

The quote contains an opaque quote ID, resource commitment, seller, token, amount, ReceiptGate address, expiry and an exact statement of what the commitment proves.

### Wallet executor

`GhostModeClient` is the reusable, wallet-keyless execution surface exported from `src/lib/ghostmode`. Its purchase action builder produces exactly two STRK20 actions:

1. A normal encrypted transfer to the seller.
2. One external invocation of ReceiptGate.

STRK20 permits at most one external invoke in a pool transaction. No open note is created, so the payment token and amount remain encrypted inside the pool.

The browser currently uses the Wallet API so a real user can run the Sepolia demonstration without giving the application a viewing key. A headless agent runner will implement the same executor interface with the Privacy SDK after production proving and discovery endpoints are configured.

Registration remains wallet-owned. The Wallet API exposes balances and private actions but no dapp-side viewing-key registration method. If the pool reports `NOT_REGISTERED`, GhostMode directs the user to activate privacy through the wallet's native shield flow and then retry.

### ReceiptGate

The Cairo helper pins the STRK20 pool at deployment. It rejects calls from another contract, a mismatched pool placeholder, zero commitments, expired quotes and reused quote IDs.

It returns an empty `Span<OpenNoteDeposit>`. The payment is the separate normal-note transfer in the same pool transaction.

### Seller verifier and delivery

`POST /api/demo-intel/unlock` verifies the exact successful ReceiptGate event for the quote, then asks a trusted seller service to discover the matching private note. Content is returned only when both checks pass. A gate event without seller note discovery returns a locked response because the event alone cannot prove the seller, token or amount hidden inside the encrypted note.

The seller verifier holds the seller viewing key outside the browser and outside GhostMode. Its bearer token and URL are server-only environment variables. The local quote store is an ephemeral development adapter; production deployments must use durable, shared storage with the same interface.

## Atomicity and its limit

If ReceiptGate reverts, the enclosing pool transaction reverts, including the private transfer. This binds gate acceptance and payment execution atomically.

ReceiptGate v0.1 does not independently prove that the hidden transfer matches the quote's seller, token or amount. The buyer's executor constructs those actions, and the seller must verify its discovered note before releasing the decryption key. This boundary is material and must remain in public documentation.

## Future agent runner

The Privacy SDK route owns an account signing key and viewing key, note discovery, proving and submission. It requires Node.js 24+, a compatible prover, an indexer/discovery provider, and strict sequencing against a sufficiently old proving block. Those operational dependencies are intentionally not hidden behind mock services in the current build.

# Internal Security Review

Date: 2026-08-29. Scope: GhostMode application, ReceiptGate, seller verifier, storage, and deployment design. This is an internal engineering review, not an independent security audit.

## Security properties reviewed

- Privacy requirements fail closed; there is no silent public-payment downgrade.
- Quote IDs commit to chain, seller, gate, token, amount, resource commitment, and nonce.
- Wallet preparation precedes submission and account/network are re-read before sensitive actions.
- ReceiptGate pins the pool and signing authority, rejects malformed/expired/replayed requests, and binds signatures to its own address.
- Resource release requires both the exact public gate event and one exact seller-decrypted note ID emitted by the supplied transaction.
- Postgres uses transactional state transitions and a unique transaction-hash constraint; production refuses the memory fallback.
- Public boundaries use strict schemas, bounded request rates, sanitized errors, and no secret-bearing responses.

## Verified evidence

- 28 TypeScript tests pass: policy, request integrity, tamper resistance, action shape, agent policy/orchestration, replay state, validation, rate limiting, and exact-note matching.
- Three mocked-wallet integration tests pass.
- Nine Cairo tests pass, including unauthorized caller, pool substitution, expiry boundary, replay, malformed identifiers, bad signature, and cross-request substitution.
- Production TypeScript build passes.

## Open security risks

- No current ReceiptGate, seller registration, private payment, or paid unlock has been verified on Sepolia.
- Postgres behavior has not been exercised against a real server or multiple app replicas.
- Seller runtime dependencies are not installed locally; the verifier has not completed a real discovery call.
- The verifier currently holds both seller spending and viewing material; compromise has high impact.
- Built-in application rate limiting is per instance. Production needs edge/distributed controls and authentication for valuable resources.
- Wallet extension timeout and historical `M_ID` behavior remain unverified against current wallet releases.
- Dependency review, container scan, penetration test, and independent Cairo/application audit are outstanding.

## Decision

Suitable for continued Sepolia engineering after the actions in `ACTION_REQUIRED.md`. Not approved for Mainnet or real-value use. A current live flow, durable-store exercise, operational key isolation, and independent review are mandatory before changing that decision.

# Security architecture

This document describes implemented controls and remaining trust. It is not an audit report. Use the root [security policy](../SECURITY.md) to report a vulnerability.

## Key management

| Key/material | Holder | Purpose | Consequence of compromise |
|---|---|---|---|
| Buyer spending/viewing keys | Privacy wallet | Account consent, note discovery, proof construction, submission | Buyer confidentiality and funds may be lost |
| Seller account private key | Seller verifier | Required by current lower-level SDK account setup | Seller account funds/actions may be compromised |
| Seller viewing key | Seller verifier | Discover seller private notes | Seller payment history can be read; cannot spend by itself |
| Quote-authority private key | Root server | Sign opaque request/commitment/expiry | Fraudulent quotes can be authorized; cannot spend seller funds |
| Verifier bearer token | Root + seller verifier | Authenticate note-check calls | Attacker can query the narrow verifier endpoint |
| RPC/provider key | Browser or server, depending variable | Chain access | Quota abuse, traffic observation, or service denial |

No buyer key or decrypted note belongs in the GhostMode browser code or API. Never place a secret in a `NEXT_PUBLIC_` variable.

## Frontend and wallet trust

The frontend is untrusted presentation code. It discovers wallets, requests accounts/chain/API versions, builds typed actions, and displays boundaries. The wallet remains the key, note, prover, and user-consent boundary. A malicious or compromised wallet can reveal or misuse keys; GhostMode cannot defend it.

Capability detection uses `supportedWalletApi` and requires 0.10.3 or newer. It does not probe private balances merely to detect support because balance access is a separate consented action.

## Privacy downgrade prevention

The policy engine returns a public route only when every privacy requirement is false. Missing wallet capability, unregistered recipient, unsupported action, hidden-calldata request, hidden-state request, or unavailable helper produces refusal. Callers must treat `supported: false` as terminal unless the user deliberately changes requirements.

## Contract authorization

ReceiptGate checks:

- nonzero constructor values;
- caller equals the pinned STRK20 pool;
- supplied pool placeholder equals the pinned pool;
- nonzero quote ID and resource commitment;
- current block timestamp is not later than expiry;
- quote ID has not been consumed;
- Stark-curve signature matches Poseidon of gate, quote, commitment, and expiry.

The gate address in the digest prevents cross-contract replay. Consumption prevents same-gate replay. A new deployment uses separate state and must not accept old quotes unless intentionally signed for it.

## Invoice and network validation

The parser bounds expiry to 24 hours, validates nonzero felts and positive base-unit amount, and requires explicit chain ID. `buildPrivatePurchaseActions` checks that quote network and chain ID agree. The UI checks the connected chain before submission.

## Transaction confirmation

The wallet simulates purchases before submission. A returned hash is treated as submitted even if RPC confirmation times out. A timeout without a hash is treated as uncertain and triggers bounded public evidence recovery. Retrying uncertain payments automatically is unsafe.

Resource release requires a successful exact gate event and one unambiguous seller note. Either failure keeps the resource locked.

## Replay and concurrency

Onchain replay is protected by `consumed[quote_id]`. The root server uses `pending → submitted → released` state, transactional Postgres row locks, and a unique transaction-hash constraint to reject competing claims and cross-quote transaction reuse. Development/test may use a clearly reported process-memory fallback; production fails closed without `DATABASE_URL`. A real multi-replica database exercise is still required before production approval.

## Server trust

A compromised root server can expose stored resources/quotes, issue policy responses, and—if it has the quote key—authorize requests. It cannot decrypt buyer notes without wallet material.

A compromised seller verifier is higher impact because the current implementation has seller account and viewing keys. Isolate it from the public frontend and never return note contents. Exact matching uses note IDs emitted by the supplied pool transaction plus seller decryption and amount; ambiguous matches fail closed.

## Logging

Allowed: opaque quote ID, transaction hash, network, coarse status, sanitized error code, timing metrics. Prohibited: seed phrases, spending/viewing keys, decrypted notes, bearer tokens, full environment, raw private provider payloads, or reconstructed buyer-to-seller graphs.

## Dependency and deployment controls

Versions are pinned in the root project and seller package. `package-lock.json` covers the root app; the seller service cannot gain a lockfile until GitHub Packages access is authorized and must not be deployed without one. CI runs lint, types, unit/integration tests, a production build, and Cairo tests. Mainnet deployment is blocked unless `CONFIRM_MAINNET_DEPLOYMENT=true`; payment still requires explicit wallet confirmation.

## Security checklist before production

- Independent Cairo and application security review
- Live Postgres migration, restart, backup, and concurrency exercise
- Published incident contact and private reporting enabled
- Seller service secret manager, isolation, rotation, and audit logs
- Pinned/verified RPC, proving, discovery, pool, gate, and authority configuration
- OHTTP/pinned service keys where supported
- Live wallet/browser tests for each supported version
- Rate limiting, user authentication, authorization, and resource access control
- Recovery procedures for quote key, seller key, RPC outage, and ambiguous notes

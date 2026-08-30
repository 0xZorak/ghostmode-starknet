# GhostMode audit findings

This is an internal engineering review, not an independent security audit.

## Critical

### GM-001 — Resource claims are not durable

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: `src/lib/ghostmode/server/quote-store.ts` stores quotes and consumption state in process memory.
- Impact: restart loses quotes; multiple instances can disagree; replay and double-unlock guarantees do not hold across processes.
- Remediation: added transactional Postgres storage, migration, a unique transaction-hash constraint, production fail-closed behavior, and a cross-quote transaction-reuse test. A live database restart/concurrency test remains blocked on hosted Postgres.

### GM-002 — No live private-payment evidence

- Status: VERIFIED
- Evidence: automated integration tests mock `WalletAccountV6`; `strk20.json` contains no transaction evidence.
- Impact: the central product claim remains unverified.
- Required remediation: complete Sepolia registration, shield, note maturity, private payment, seller discovery, gate receipt, and resource unlock with public hashes.

## High

### GM-003 — Configured ReceiptGate is not authoritative

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: current source was deployed at `0x047eecea2ea640de0c583a501fd001d639cd9bce5f0dc5cee7be6c95f048d71c`; read-only verification confirms its pinned Sepolia pool and matching quote-authority public key.
- Impact: runtime authorization is unavailable or can target an incompatible ABI.
- Required remediation: generate a quote authority, deploy the current class, record deployment JSON, and verify class/configuration onchain.
- Latest result: deployment succeeded on 2026-08-30 in transaction `0x036c4e5368c0ce234d94a67930b18030ab203d2273222c9b2cdb1f63d2dd5288`. Application defaults and deployment evidence now point to it. A live private invocation remains unverified.

### GM-011 — Signed quote ID did not prove payment terms

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: the original authorization signed gate, quote ID, resource commitment, and expiry while the quote ID was derived only from random data and report bytes.
- Impact: an altered seller, token, amount, network, or gate could reach wallet preparation without cryptographic commitment to those terms.
- Remediation: protocol `ghostmode-http402/0.2` derives the quote ID from a Poseidon commitment over chain, seller, gate, token, amount, resource commitment, and nonce. Client preparation recomputes it and tamper tests cover every field. A live ReceiptGate transaction remains unverified.

### GM-004 — Seller verifier is an undeployed high-value service

- Status: VERIFIED
- Evidence: the verifier requires a spending key and viewing key, binds to `127.0.0.1`, has no container/deployment manifest, and `npm --prefix seller-verifier ls --depth=0` reports its SDK and Starknet runtime dependencies missing.
- Impact: it cannot currently support a hosted demo; compromise would expose seller privacy and spending authority.
- Required remediation: isolate registration from runtime where possible, validate startup, add rate limiting/redaction, containerize, and deploy with a dedicated low-value account.
- Reproduction: authenticated installation returned HTTP 403 because the local GitHub token lacks `read:packages`; tracked as `GM-ACT-004`.

### GM-005 — Ambiguous payment matching

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: seller note matching can rely on amount and transaction block; equal-value notes may be ambiguous.
- Impact: legitimate payments may not unlock, or weak matching could associate the wrong note.
- Remediation: official STRK20 `EncNoteCreated` events expose the opaque note ID. The verifier now intersects seller-decrypted notes with note IDs emitted by the exact transaction, plus the expected amount, and still fails closed on multiple exact matches. Two adversarial matcher tests pass; a live seller discovery remains unverified.

### GM-006 — Public endpoints lack a complete trust policy

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: quote generation and diagnostics are public; input validation and rate limiting are inconsistent.
- Impact: resource exhaustion, malformed input, and operational information exposure.
- Remediation: strict Zod schemas, bounded per-instance rate limits, a central error payload, and sanitized storage failures are implemented and tested. Production still needs distributed edge limits and application authentication for valuable resources.

## Medium

### GM-007 — Wallet boundary is weakly typed

- Status: VERIFIED
- Evidence: wallet response handling contains multiple `any` values and historical `M_ID`, timeout, and account mismatch failures are not live-reproduced.
- Impact: malformed provider responses can produce confusing or unsafe state transitions.
- Required remediation: runtime schemas/type guards, explicit uncertain-submission state, full-address display, and account/network revalidation at submission.

### GM-008 — Health reporting is incomplete

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: prover, indexer, database, quote store, and wallet prerequisites are not independently represented as reachable/configured/unsupported.
- Impact: operators cannot identify the real dependency failure.
- Remediation: structured health now reports RPC, pool, gate, signer, verifier, storage, and wallet-managed dependencies; `npm run doctor` is non-transacting. Live deployed-component verification remains blocked.

### GM-009 — Quality gates are incomplete

- Status: FIXED BUT NOT LIVE-VERIFIED
- Evidence: `lint` aliases `tsc --noEmit`; no ESLint configuration, CI workflow, full check command, or fresh-clone CI evidence exists.
- Impact: style/security regressions can merge without automation.
- Remediation: Biome lint, TypeScript, 28 unit tests, three mocked-wallet integration tests, seller syntax checks, production build, and nine Cairo tests are wired into a GitHub Actions workflow. The first remote CI run awaits push.

### GM-010 — Agent and SDK claims exceed implementation maturity

- Status: VERIFIED
- Evidence: protected data is deterministic and the SDK remains an internal module in a private application package.
- Impact: “autonomous agent” and reusable infrastructure claims can mislead reviewers.
- Required remediation: bounded spending policy plus real agent workflow; clean package boundary and minimal integration example.

## Informational constraints

- STRK20 deposits and withdrawals, their amounts, and timing remain public.
- Wallet API support must be detected by capability/version, not wallet brand.
- Xverse dapp-facing behavior is not considered verified until a live flow succeeds.
- GhostMode uses HTTP 402 semantics; it is not claimed to implement a formal interoperable x402 specification.

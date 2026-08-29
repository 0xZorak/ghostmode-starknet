# GhostMode engineering status

Evidence date: 2026-08-29. Baseline commit: `8f96a118770ac027ddb5f889c3f3c8687f290176`.

Status labels describe verified reality, not intended behavior.

| Area | Status | Evidence |
| --- | --- | --- |
| Frontend | PARTIAL | Production build passes. Operational wallet and payment states are not live-verified. |
| API | PARTIAL | Routes build; strict boundary schemas, per-instance rate limits, safe storage failures, and validation tests pass. Valuable-resource authentication and distributed edge limiting remain. |
| Database | PARTIAL | Transactional Postgres store, migration, unique transaction-hash constraint, and memory-path replay tests exist. No live Postgres migration/restart test is verified. |
| Privacy engine | VERIFIED | Four unit tests pass and unsupported private requirements fail closed. This verifies policy code only. |
| Wallet | BLOCKED | Mocked Wallet API tests pass; Xverse previously timed out and emitted `M_ID`. No real wallet success is verified. |
| STRK20 | BLOCKED | Sepolia pool/RPC are reachable. Registration, shield, balance discovery, and private transfer lack verified transaction evidence. |
| ReceiptGate | PARTIAL | Current Cairo source compiles and 9/9 tests pass. Read-only Sepolia check verifies deployer `0x0573…8327` is deployed with ~5.0055 test STRK. Current gate deployment awaits owner-generated quote authority. |
| Quote signer | PARTIAL | Private key generation no longer prints the secret; payment terms are committed into the signed quote ID and tamper tests pass. Runtime keys/onchain authority are not configured. |
| Seller verifier | BLOCKED | Exact-transaction note-ID matching and two adversarial tests pass; server hardening is implemented. Runtime SDK dependencies remain unavailable due missing GitHub Packages scope, and it is not configured, hosted, or live-tested. |
| Resource unlock | BLOCKED | Server code fails closed, but durable replay protection and a real paid unlock are not verified. |
| Agent | PARTIAL | Intent planning and payment orchestration exist. The protected payload is deterministic, not an autonomous research agent. |
| SDK | PARTIAL | Local TypeScript facade exists and tests pass. No publishable package boundary or minimal external example exists. |
| CI | BLOCKED | Workflow is tracked and local equivalents pass. GitHub run `33224762551` rejected both jobs before startup because the account is locked by a billing issue; see GM-ACT-005. |
| Hosting | NOT STARTED | GitHub has no Website URL; no frontend or verifier deployment is verified. |
| Sepolia | BLOCKED | Read-only network checks work; no current gate, seller registration, shield, private payment, receipt, or unlock evidence. |
| Mainnet | NOT STARTED | Correctly gated behind Sepolia. `strk20.json` remains empty. |
| Documentation | PARTIAL | README and required documentation set include deployment, key management, internal security review, demo script, troubleshooting, and truthful limitations. Final live evidence is unavailable. |
| Security | PARTIAL | Fail-closed design, signed term commitments, transactional storage, boundary validation, rate limiting, sanitized errors, exact note matching, and negative tests exist. Live infrastructure exercise and independent review remain. |

## Reproduced baseline

- `npm run check`: VERIFIED — Biome lint passed; TypeScript passed; 28/28 unit tests passed; 3/3 mocked integration tests passed; seller-verifier syntax passed; Next.js production build passed. The seller syntax check does not install or execute its runtime dependencies.
- `scarb test`: VERIFIED — 9/9 ReceiptGate tests passed.
- Fresh clone of pushed commit `f5fc22f`: VERIFIED — `npm ci` found zero vulnerabilities and `npm run check` passed without local environment files.
- These tests do not prove wallet, prover, indexer, seller discovery, Sepolia transaction, hosting, or Mainnet behavior.

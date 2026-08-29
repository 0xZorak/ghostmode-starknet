# GhostMode engineering status

Evidence date: 2026-08-29. Baseline commit: `8f96a118770ac027ddb5f889c3f3c8687f290176`.

Status labels describe verified reality, not intended behavior.

| Area | Status | Evidence |
| --- | --- | --- |
| Frontend | PARTIAL | Production build passes. Operational wallet and payment states are not live-verified. |
| API | PARTIAL | Routes build; strict boundary schemas, per-instance rate limits, safe storage failures, and validation tests pass. Valuable-resource authentication and distributed edge limiting remain. |
| Database | PARTIAL | Transactional Postgres store, migration, unique transaction-hash constraint, and memory-path replay tests exist. No live Postgres migration/restart test is verified. |
| Privacy engine | VERIFIED | Four unit tests pass and unsupported private requirements fail closed. This verifies policy code only. |
| Wallet | PARTIAL | Buyer `0x054a…6d2a` has a nonzero public viewing key in the Sepolia pool. Dapp-facing Xverse shield/payment calls and balance discovery remain unverified. |
| STRK20 | PARTIAL | Sepolia pool/RPC and buyer registration are verified read-only. Shield, note maturity, balance discovery, and private transfer lack verified transaction evidence. |
| ReceiptGate | BLOCKED | Current Cairo source compiles and 9/9 tests pass. Deployment failed pre-submission fee validation: ~10.09 STRK maximum estimate exceeded ~5.01 STRK balance. No gate was deployed; GM-ACT-006 is open. |
| Quote signer | PARTIAL | Secure local key generation is verified and payment terms are committed into signed quote IDs. Matching onchain ReceiptGate authority and runtime server configuration remain unavailable. |
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

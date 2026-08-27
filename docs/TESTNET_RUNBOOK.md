# Sepolia test runbook

1. Complete [QUICKSTART.md](QUICKSTART.md).
2. Run every root and Cairo quality gate.
3. Generate and secure a quote-authority pair.
4. Deploy and verify the signed ReceiptGate using [SEPOLIA_DEPLOYMENT.md](SEPOLIA_DEPLOYMENT.md).
5. Register and start the isolated seller verifier.
6. Require `/api/health` to report the pool, gate, authority, and verifier ready.
7. Connect a privacy-compatible wallet on `SN_SEPOLIA`.
8. Activate privacy in the wallet if `NOT_REGISTERED` is returned.
9. Shield a small test amount and wait for note maturity.
10. Read the shielded balance, inspect a fresh quote, submit once, and verify the real hash.
11. Confirm ReceiptGate consumption, seller note discovery, and one-time resource release.

If the wallet times out, do not retry until wallet Activity, Voyager, pending-shield recovery, and gate-event recovery show that no transaction was accepted.

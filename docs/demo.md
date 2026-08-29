# Demo guide

This walkthrough takes two to five minutes. The analysis path works without funded keys. The live path requires every readiness check and a privacy-capable Sepolia wallet.

## Prerequisites

- App running with `npm run dev`
- For quote inspection: configured matching quote-signing keypair
- For live payment: current verified gate, registered seller, seller verifier, funded/activated wallet, and mature shielded STRK

## Analysis-only demo

1. Open <http://localhost:3000>.
2. Scroll to the workbench.
3. Leave the endpoint as `/api/demo-intel` and inspect the route.
4. Show the requested-versus-actual privacy explanation and 80/100 transfer score.
5. Open the compatibility compiler.
6. Choose private transfer and compile: direct route.
7. Choose a custom action, require hidden calldata/state or two invokes, and compile: explicit refusal.
8. Export the compatibility manifest.

### What to notice

- GhostMode explains unavoidable public metadata.
- It distinguishes a normal encrypted note from an open-note/private-invoke boundary.
- It refuses impossible privacy instead of offering a public fallback.
- The manifest is an integration plan, not generated “audited” Cairo.

## Live Sepolia demo

Do this only after [`/api/health`](api.md#get-apihealth) reports `ready: true`.

1. Connect the supported wallet on Sepolia.
2. Confirm API 0.10.3+ appears.
3. If needed, activate privacy inside the wallet.
4. Shield a deliberate amount in advance and wait for note maturity.
5. Read shielded balance through the wallet consent prompt.
6. Inspect a fresh `/api/demo-intel` quote.
7. Show seller, gate, expiry, and resource commitment.
8. Execute private purchase once.
9. Show simulation before submission.
10. Track the returned real transaction hash.
11. Show public ReceiptGate acceptance, seller note verification, and resource release.
12. Attempt status/release again to show replay protection rather than paying again.

### What to notice

- One pool transaction contains an encrypted transfer and seller-authorized receipt action.
- ReceiptGate cannot decrypt the payment; private seller discovery is a separate release requirement.
- The public event contains opaque request/commitment data but no buyer, seller-recipient, token, or amount.
- A timeout is recovered through evidence; the UI never tells the user to blindly resubmit.

## If the live flow is not configured

Say so directly. Show `/api/readiness`, the passing automated tests, the Cairo tests, the read-only pool checks, and the exact remaining deployment steps. Do not use a fake hash or imply a mocked integration test was a public-network payment.

## Useful commands

```bash
npm run check
cd cairo && scarb test
node scripts/network-check.mjs sepolia
```

# Judge demo

## One-line pitch

GhostMode is a privacy compiler and payment rail that lets AI agents buy Starknet resources through STRK20—and refuses when the requested privacy is impossible.

## Two-minute flow

1. Start with `npm run demo` and open the displayed local URL.
2. Point out the status row: network, wallet, Privacy API, gate, and seller verifier.
3. Inspect the included `/api/demo-intel` endpoint. Explain that the HTTP 402 request is seller-signed and expires.
4. Show the requested-versus-actual matrix, “Why?” explanations, 80/100 score, and public timing/entry-edge disclosure.
5. Show the compatibility compiler rejecting hidden public calldata/state or more than one external invoke.
6. Connect the configured Sepolia privacy wallet and read its shielded balance.
7. Execute the private purchase once. The wallet simulates before it submits one encrypted transfer plus one gate invoke.
8. Show the real transaction hash, `ReceiptAccepted`, seller verification, and unlocked Premium AI Market Intelligence Report.

## If a funded wallet is unavailable

Demonstrate policy evaluation, API 402 shape, signature/replay contract tests, and the SDK integration tests. Say “simulation/analysis only.” Do not display a fake hash or claim that a transaction occurred.

## Proof commands

```bash
npm test
npm run test:e2e
npm run build
cd cairo && scarb test
```

## What makes it STRK20-native

The wallet holds viewing keys, discovers notes, proves and submits. Payment uses a normal encrypted STRK20 transfer. The receipt helper is called by the pool in the same atomic transaction and returns the exact official helper ABI. Without STRK20 the payment graph is public and the product's central guarantee disappears.

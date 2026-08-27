# Mainnet

> **MAINNET — REAL FUNDS.** Read-only checks do not spend. Deployment, shielding, payment, and unshielding do.

## Prerequisites

- Node 24 and pinned dependencies installed from `package-lock.json`
- Privacy-compatible Wallet API wallet on `SN_MAIN`
- Trusted mainnet RPC in `GHOSTMODE_MAINNET_RPC_URL`
- Verified current STRK20 pool and supported token
- Fresh mainnet ReceiptGate deployed with the mainnet pool and quote-authority public key
- Registered seller verifier with production secret management
- Durable quote/status store (the included Map is not production-safe)

## Read-only check

```bash
npm run mainnet:check
```

It checks RPC chain ID, pool class, STRK token class, configured ReceiptGate class and pool binding, and reports runtime-only wallet/service checks honestly. It submits no transaction.

## Dry run

```bash
npm run mainnet:dry-run
```

This remains read-only. A full STRK20 fee simulation requires a connected privacy wallet and a prepared proof, so the CLI reports `NOT_AVAILABLE...` rather than inventing an estimate. Use wallet simulation immediately before explicit confirmation.

## Deployment

```bash
CONFIRM_MAINNET_DEPLOYMENT=true \
GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=0x... \
npm run deploy:mainnet
```

The command aborts without the confirmation flag, account file, public key, or `sncast`. It deploys only ReceiptGate; it does not transfer, shield, or unshield tokens.

## Tiny real-fund test

1. Confirm the UI says `SN_MAIN` and **MAINNET — REAL FUNDS**.
2. Choose a small amount yourself in the wallet; GhostMode disables its fixed one-STRK shield button on mainnet.
3. Read the shielded balance after note maturity.
4. Inspect the seller quote, amount, gate, expiry, and privacy matrix.
5. Approve exactly once. Track the returned hash on Voyager.
6. Stop if the hash is uncertain; do not resubmit until Activity and gate events are checked.

To stop safely, reject the wallet prompt, unset `CONFIRM_MAINNET_DEPLOYMENT`, stop the seller service, and revoke/rotate server credentials if exposure is suspected.

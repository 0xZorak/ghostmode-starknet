# Mainnet guide

> [!CAUTION]
> Starknet Mainnet uses real assets. Contract deployment, shielding, private transfers, pool fees, and withdrawals can spend funds. Complete and record the Sepolia flow first.

## Current status

The read-only 2026-08-29 check confirmed the configured Mainnet RPC, STRK20 pool, and STRK token contracts. No GhostMode Mainnet ReceiptGate, seller, seller verifier, or payment transaction is configured in the repository. `strk20.json` contains no transaction or contract claim.

## Commands that cannot spend

```bash
npm run mainnet:check
npm run mainnet:dry-run
```

Both scripts perform RPC/class/storage reads only and report `transactionSubmitted: false`. `mainnet:dry-run` does not create a proof or estimate a real private payment because no wallet is attached.

## Release checklist

- Current official Mainnet pool address independently verified
- Exact wallet and Wallet API version manually tested
- Quote format, policy output, and no-public-fallback behavior reviewed
- ReceiptGate source reviewed/audited and all Cairo tests passing
- Quote authority backed up and separated from funded accounts
- Dedicated seller identity registered and seller verifier isolated
- Durable transactional quote/release store replaces in-memory map
- RPC, prover, indexer, OHTTP, and monitoring trust reviewed
- Real-funds amount/fee limits and incident recovery approved
- Sepolia end-to-end evidence recorded

## Deploy ReceiptGate: spends Mainnet STRK

> [!CAUTION]
> The following command submits a Mainnet contract deployment and may spend real STRK.

Prepare a gitignored sncast account file and quote-authority public key, then run only after deliberate review:

```bash
export CONFIRM_MAINNET_DEPLOYMENT=true
export GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=<public-key>
npm run deploy:mainnet
```

The guard authorizes only the deployment script. It does not shield or transfer tokens. Verify the deployed class/source, pool binding, and authority key before configuring it.

## Configure application

```dotenv
NEXT_PUBLIC_GHOSTMODE_NETWORK=mainnet
NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET=0x<verified-gate>
NEXT_PUBLIC_GHOSTMODE_SELLER_MAINNET=0x<registered-seller>
CONFIRM_MAINNET_TEST_MODE=true
```

`CONFIRM_MAINNET_TEST_MODE` allows the demo preflight to start; it does not authorize a wallet payment. The UI disables fixed one-STRK shielding on Mainnet and asks for explicit purchase confirmation.

## Mainnet payment: may spend real assets

> [!CAUTION]
> A wallet confirmation for shield, transfer, private invoke, or withdrawal can spend real assets and fees. Verify token, amount, seller, gate, pool, chain, and quote expiry in the wallet before approving.

Do not automate retries. A timeout can mean a transaction was submitted but not yet visible through the selected RPC. Check wallet Activity, explorer, gate event, payment status, and seller verifier before deciding what happened.

## Submission metadata

Only after real Mainnet execution, add three genuine transaction hashes that touched the required STRK20 pool and verified current contract addresses to `strk20.json`. Never add Sepolia hashes, placeholders, failed hashes, or historical incompatible deployments.

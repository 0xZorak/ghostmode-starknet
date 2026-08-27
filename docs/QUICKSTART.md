# Quickstart

## Prerequisites

- Node.js 24 and npm 11
- A Starknet wallet that reports STRK20 Wallet API 0.10.3 or newer
- Sepolia STRK for test fees and shielding
- An Alchemy Starknet key for the browser RPC
- For Cairo: Scarb 2.20.1, Cairo 2.20.0, Starknet Foundry 0.63.0, and Universal Sierra Compiler

## Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_ALCHEMY_KEY`. Keep `NEXT_PUBLIC_GHOSTMODE_NETWORK=sepolia`. The workbench can evaluate privacy without a deployed gate; live payment requires the gate, registered seller, quote signer, and seller verifier.

## Create the receipt authority

```bash
npm run quote-signer:generate
```

Copy both lines immediately. Put the private key only in server secret storage. Put the public key in `GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY` and pass it as ReceiptGate constructor argument 2. This is a quote-only key, not a funded Starknet account key.

## Start the seller verifier

```bash
cd seller-verifier
npm install
cp .env.example .env.local
npm run register
npm start
```

The seller account and viewing key never belong in the root app or any `NEXT_PUBLIC_` variable.

## Verify

```bash
npm run lint
npm test
npm run test:e2e
npm run build
cd cairo && scarb test
```

Open `/api/health`. `ready: true` means RPC, pool, receipt contract, receipt authority, and seller verifier are all reachable. A false value is honest readiness, not a simulated failure.

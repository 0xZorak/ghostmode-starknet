# Quickstart

This path starts the UI and analysis APIs without spending funds. Live private actions are a separate manual step.

## Prerequisites

- Git
- Node.js 24 and npm 11 (`.nvmrc` contains `24`)
- A Starknet RPC endpoint; the public Cartridge endpoint is the development fallback
- Optional for live Sepolia: a wallet that reports Wallet API 0.10.3 or newer, Sepolia STRK, and an activated STRK20 identity
- Optional for Cairo: Scarb 2.20.1, Cairo 2.20.0, Starknet Foundry 0.63.0, Universal Sierra Compiler 2.10.0

Wallet support changes. GhostMode checks the connected wallet's reported API version at runtime instead of trusting its brand name.

## Clone and run

```bash
git clone https://github.com/0xZorak/ghostmode-starknet.git
cd ghostmode-starknet
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

Expected result: the workbench loads on Sepolia. You can use the compatibility compiler without a wallet. `/api/readiness` identifies which live-purchase pieces are missing.

## Minimum configuration

The default public RPC can run local analysis, but a restricted browser-safe provider key is more reliable:

```dotenv
NEXT_PUBLIC_GHOSTMODE_NETWORK=sepolia
NEXT_PUBLIC_ALCHEMY_KEY=<browser-safe-restricted-key>
```

Do not put a spending key, viewing key, quote-signing private key, or seller-verifier token in a `NEXT_PUBLIC_` variable. See [configuration](configuration.md).

## Verify the local build

```bash
npm run check
```

This runs TypeScript checking, 15 unit tests, 3 mocked-wallet integration tests, seller-service syntax checks, and a production Next.js build. Contract tests are separate:

```bash
cd cairo
scarb test
```

## Enable quote inspection

Generate a quote-only Stark-curve keypair:

```bash
npm run quote-signer:generate
```

Store the private value only in `.env.local` or a deployment secret store:

```dotenv
GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY=<generated-private-key>
GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=<generated-public-key>
```

The included protected endpoint still needs nonzero seller and gate addresses before it can produce an executable quote. Do not use the historical gate in `cairo/address.md`; its ABI predates signed quote authorization.

## Enable the complete Sepolia purchase

Complete these in order:

1. [Deploy and verify a current ReceiptGate](sepolia.md).
2. Configure `NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA` and a registered `NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA`.
3. [Configure and start the seller verifier](seller-verification.md).
4. Require `/api/health` to report `ready: true`.
5. Connect a privacy-capable wallet on `SN_SEPOLIA`.
6. Shield funds separately, wait for note maturity, inspect a fresh quote, and submit it once.

The proving and discovery URLs used by the seller service come from the STRK20 operator; an Alchemy RPC cannot replace them.

## Next steps

- Run the [demo](demo.md).
- Call the [privacy checker](privacy-checker.md).
- Integrate the [agent SDK](agent-sdk.md).
- Read the [privacy model](privacy-model.md) before making product claims.

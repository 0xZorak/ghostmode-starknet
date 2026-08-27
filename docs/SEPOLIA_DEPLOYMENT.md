# Sepolia deployment

## Safety

Sepolia tokens have no monetary value, but transactions and keys are still real test infrastructure. Never reuse a mainnet spending key.

## Build and test

```bash
cd cairo
scarb build
scarb test
```

## Quote authority

```bash
npm run quote-signer:generate
```

Store the private key in the root server's secret environment. Export the public key for deployment:

```bash
export GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=0x...
```

## Account and deployment

```bash
npm run gate:account:create
# Fund the printed address with Sepolia STRK
npm run gate:account:deploy
npm run deploy:sepolia
```

`sncast` prints class hash, contract address, declare/deploy transaction hashes, and explorer links. Record only actual output. Then:

```bash
GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=0x... npm run gate:verify -- 0xCONTRACT
```

Verification checks both pool binding and, when supplied, the authority key. Set `NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA` only after it returns `valid: true`.

## Important migration note

The historical contract in `cairo/address.md` predates signed seller authorization and is ABI-incompatible. Do not use it with the current wallet action builder. A fresh deployment is required.

## Final live test

Register the seller, start the verifier, open `/api/health`, connect the same-network privacy wallet, shield a small explicitly chosen test amount using the wallet, read the private balance after maturity, inspect the demo invoice, and submit once. If the wallet times out, check its Activity and GhostMode recovery before retrying.

# Sepolia deployment and test guide

Sepolia tokens have no monetary value, but its accounts, keys, contracts, and transactions are real test infrastructure. Never reuse a Mainnet spending or viewing key.

## 1. Verify tools and code

```bash
node --version
npm --version
scarb --version
./.tools/bin/snforge --version
./.tools/bin/universal-sierra-compiler --version
npm run check
cd cairo
scarb test
cd ..
```

## 2. Read-only network check

```bash
node scripts/network-check.mjs sepolia
```

Expected essentials: `rpc`, `privacyPool`, and `token` are `PASS`; `transactionSubmitted` is `false`. Gate and verifier remain `NOT_CONFIGURED` until later steps.

## 3. Create quote authority

```bash
npm run quote-signer:generate
```

Store the private key only in server secret storage. Put the public key in the environment used for deployment and the root server:

```dotenv
GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY=<secret>
GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=<public-key>
```

This key authorizes quotes; it is not a funded Starknet account key.

## 4. Create and fund deployment account

```bash
npm run gate:account:create
```

The script writes the account to `.secrets/sncast-accounts.json` and prints an address. Fund that address with Sepolia STRK, then:

```bash
npm run gate:account:deploy
```

These are real Sepolia transactions.

## 5. Deploy current ReceiptGate

```bash
export GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=<public-key>
npm run deploy:sepolia
```

The script deploys `ReceiptGate` with:

1. Sepolia pool `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`
2. the exported quote-authority public key

Record the real class hash, contract address, transaction hashes, and explorer links from `sncast` output.

## 6. Verify gate

```bash
GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=<public-key> npm run gate:verify -- 0x<gate-address>
```

Require `valid: true`, the exact Sepolia pool, and `authorityMatchesEnvironment: true`. Only then set:

```dotenv
NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA=0x<gate-address>
NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA=0x<registered-seller-address>
```

The current verified deployment is recorded in `deployments/sepolia.json` and `cairo/address.md`. The separately labelled historical deployment is ABI-incompatible and must not be used.

## 7. Register and start seller verifier

Follow [seller verification](seller-verification.md). Registration is a real Sepolia transaction and the selected proving base must include account deployment and funding state.

## 8. Check readiness

Start the root app and verifier, then inspect:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/readiness
```

Require `readyForResourceUnlockTesting: true` for the single-process local demo. `readyForProduction` must also be true before claiming a durable deployment is configured; it stays false with the development-only ephemeral quote store.

## 9. Manual wallet flow

1. Connect the intended account on `SN_SEPOLIA`.
2. Confirm the wallet reports API 0.10.3+.
3. Activate privacy/register inside the wallet if required.
4. Ensure public STRK covers shield amount, pool fee, and transaction allowance.
5. Shield a small deliberate amount. Approval and deposit may require separate prompts.
6. Wait roughly ten blocks for a newly created note to mature before spending it later.
7. Read shielded balance through the wallet consent prompt.
8. Inspect a fresh quote.
9. Confirm the transfer + ReceiptGate invoke once.
10. Track the real hash; do not resubmit on timeout.
11. Verify resource release and confirm the quote cannot release twice.

## Current verification status

The current ReceiptGate is deployed at `0x047eecea2ea640de0c583a501fd001d639cd9bce5f0dc5cee7be6c95f048d71c`; its pool and quote-authority configuration pass read-only verification. The buyer has a nonzero pool public key and a 1 STRK shield deposit was accepted. The dedicated seller registered successfully in transaction `0x2c76c13721b239bdd0bf6d25e59ecceb0b6fd464142ad27ba4bd3ba4ede0782`, its pool public key is nonzero, and the local verifier health check passes. The private payment, receipt event, incoming-note match, and resource unlock are not yet live-verified. Do not describe this build as a working full Sepolia payment until those steps produce evidence.

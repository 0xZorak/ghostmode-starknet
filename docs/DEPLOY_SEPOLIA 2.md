# Deploy GhostMode on Starknet Sepolia

This is the exact deployment order. Do not put account private keys, viewing keys,
Alchemy keys or verifier tokens in Git.

## Current deployment account

- Address: `0x057312187e9667687af5b7befd704a2a0bfe8fcd5d7db600341f5ecd9dc88327`
- Network: Starknet Sepolia
- Local account file: `.secrets/sncast-accounts.json` (gitignored)
- Status: deployed on Starknet Sepolia

The account was funded and deployed successfully.

## Deployed ReceiptGate

- Contract: `0x0464d61f09b05369b320a806ffef39a60afd4c811fead7bad289e85cf3bfcd6f`
- Class: `0x052df5bfa91063afdb14fbd1a572e18911e1292356c5a4bb1583134a62935b15`
- Pool verification: passed

## 1. Deploy the account and ReceiptGate

After funding is accepted on Sepolia:

```bash
npm run gate:account:deploy
npm run gate:deploy
```

Copy the ReceiptGate contract address printed by the second command, then verify that
it is pinned to the expected STRK20 Sepolia pool:

```bash
npm run gate:verify -- 0xYOUR_GATE_ADDRESS
```

Do not continue unless `valid` is `true`.

## 2. Configure the dapp

In the root `.env.local`, set:

```dotenv
NEXT_PUBLIC_GHOSTMODE_NETWORK=sepolia
NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA=0xYOUR_GATE_ADDRESS
NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA=0xYOUR_SELLER_ADDRESS
GHOSTMODE_SELLER_VERIFIER_URL=http://127.0.0.1:8787/verify-note
GHOSTMODE_SELLER_VERIFIER_TOKEN=THE_SAME_RANDOM_TOKEN_USED_BY_THE_VERIFIER
```

The seller must be an account whose private key the verifier can use. The deployment
account can be reused for local testnet testing.

## 3. Install and configure the seller verifier

The Privacy SDK is distributed through GitHub Packages. Authenticate locally without
committing a token:

```bash
gh auth refresh -h github.com -s read:packages
cd seller-verifier
export NODE_AUTH_TOKEN="$(gh auth token)"
npm install
unset NODE_AUTH_TOKEN
cp .env.example .env.local
npm run generate:viewing-key
```

Fill `seller-verifier/.env.local`. The seller address and private key must belong to the
same deployed Sepolia account. Obtain `STRK20_PROVING_SERVICE_URL` and
`STRK20_INDEXER_URL` from the STRK20 operator/hackathon team; an Alchemy RPC cannot
replace either service.

Register the seller once and start the verifier:

```bash
npm run register
npm start
```

Keep the generated viewing key. Losing or replacing it prevents discovery of notes
created for that registered seller identity.

## 4. Start and test GhostMode

From the project root:

```bash
npm run dev
```

Open `http://localhost:3000/api/readiness` first. Then follow
`docs/TESTNET_RUNBOOK.md`. A successful demo must show three separate facts:

1. the shield transaction succeeded and the wallet reads the shielded balance;
2. the private purchase succeeded and ReceiptGate consumed the quote;
3. the seller verifier found the matching private note and released the resource.

Do not repeat a timed-out wallet request until wallet Activity, recovery, and the
shielded-balance read all show that no transaction was accepted.

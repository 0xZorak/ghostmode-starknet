# Seller verification

The seller verifier is an isolated Node.js 24 service in [`seller-verifier/`](../seller-verifier/). Its purpose is narrow: discover whether the configured seller received exactly one expected private note in the accepted transaction block, then return only an opaque note ID.

## Why it exists

ReceiptGate cannot decrypt an encrypted payment note. Its public event proves quote authorization and atomic gate acceptance, not the private note contents. Resource release therefore requires two independent checks:

1. Root server verifies the exact successful public `ReceiptAccepted` event.
2. Seller service discovers the matching private note.

## Credentials and trust

The service currently holds:

- seller account address and private key required by the SDK `Account` setup;
- persistent seller viewing key;
- RPC, proving-service, indexer, and pool configuration;
- bearer token for `/verify-note`.

Despite the health response's `viewingOnly: true` label, the process has spending authority because `privacy.mjs` constructs an `Account`. Run it with a dedicated low-value identity, isolate the process, restrict ingress/egress, encrypt secrets, and monitor access.

## Install

The Privacy SDK is declared as `0.14.3-rc.5` from GitHub Packages. Installation may require a GitHub token with `read:packages`:

```bash
cd seller-verifier
gh auth refresh -h github.com -s read:packages
export NODE_AUTH_TOKEN="$(gh auth token)"
npm install
unset NODE_AUTH_TOKEN
cp .env.example .env.local
```

The committed `.npmrc` contains an environment placeholder, not a token. Never replace it with a credential.

## Configure

Fill every required variable described in [configuration](configuration.md). Generate a permanent viewing key once:

```bash
npm run generate:viewing-key
```

Changing the key changes the seller's note-discovery identity. Back it up securely.

## Register the seller

```bash
npm run register
```

This is a real Sepolia transaction. The script proves against `head - 10`, pins RPC 0.10.3 so proof facts participate in the transaction hash, submits with live-price bounded resource caps and a nonzero tip floor, and waits for acceptance. The chosen proving block must already include account deployment and other transparent prerequisites. The script checks registration first and submits nothing when the identity is already registered.

The dedicated seller registered successfully on Sepolia in transaction `0x2c76c13721b239bdd0bf6d25e59ecceb0b6fd464142ad27ba4bd3ba4ede0782`. Its pool public key was read back as nonzero and the transaction receipt reports `SUCCEEDED` / `ACCEPTED_ON_L2`.

## Start

```bash
npm start
```

The service binds to `127.0.0.1:8787` by default. Put authenticated TLS ingress or a private service network in front of any remote deployment. Configure the root server with:

```dotenv
GHOSTMODE_SELLER_VERIFIER_URL=http://127.0.0.1:8787/verify-note
GHOSTMODE_SELLER_VERIFIER_TOKEN=<same-high-entropy-token>
```

## Match algorithm

1. Validate body/network/felts and exact configured seller.
2. Fetch the supplied transaction receipt and require success plus a block number.
3. Discover notes for the expected token.
4. Filter for exact amount and `note.created === receipt.block_number`.
5. Zero matches: `seller_note_not_found`.
6. Multiple matches: `ambiguous_seller_note`.
7. One match: cache and return its opaque note ID.

## Limitations

- The encrypted note does not carry the quote ID in a form this verifier checks.
- Equal-amount same-token payments to the seller in one block become ambiguous and remain locked.
- The verification cache is in memory and resets on restart.
- Discovery/indexer delay can produce a temporary zero match after payment succeeds.
- The service is Sepolia-only in code.
- OHTTP/pinned discovery transport is not enabled by this integration.

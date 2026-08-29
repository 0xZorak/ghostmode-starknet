# Key management

GhostMode uses four separate trust domains. Never reuse one key for another purpose and never put a secret in a `NEXT_PUBLIC_` variable.

## Quote signer

The quote signer authorizes an opaque ReceiptGate request; it does not hold tokens. Generate it locally with `npm run keys:quote`. The command writes the private/public pair to gitignored `.secrets/quote-signer.env` with mode `0600` and prints only the public key. Production stores the private value as `GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY` in the frontend server's secret manager. The public value must equal the key compiled into the active ReceiptGate.

If compromised, stop quote issuance, deploy a new ReceiptGate with a fresh public key, update the public gate configuration, then revoke the old server secret. ReceiptGate has no signer-update entrypoint, so rotation requires redeployment. Old unexpired quotes should be treated as unsafe.

## Seller spending key

The current Privacy SDK needs a Starknet `Account`, so the isolated verifier holds a dedicated seller account key. Use a Sepolia-only, low-value account—not a personal wallet. Store it only as `SELLER_ACCOUNT_PRIVATE_KEY` in the verifier host's secret manager. Compromise can spend that account and act as the seller.

To rotate, create and fund a fresh account, register its viewing identity with the pool, update new quotes to the new public seller address, deploy the verifier with the new secrets, and retain the old verifier only long enough to reconcile already-paid quotes.

## Seller viewing key

The viewing key lets the seller discover and decrypt its STRK20 notes. It does not by itself authorize ordinary account transactions, but compromise reveals the seller's private incoming-note history. Store it only as `SELLER_VIEWING_KEY` in the isolated verifier secret manager. Rotation creates a new private identity; it does not magically migrate old notes, so reconcile or withdraw old notes first.

## Buyer wallet keys

GhostMode never receives buyer spending keys, viewing keys, notes, or seed phrases. The privacy-capable wallet owns registration, discovery, proof generation, and signing. If any GhostMode screen or operator asks for a buyer secret, stop.

## Other secret rotation

- Verifier bearer token: generate a new high-entropy token, deploy it to verifier and root server together, then revoke the old value.
- RPC credential: create a restricted replacement, update server/browser environment as appropriate, verify health, then revoke the old key.
- Database credential: rotate in the provider, update `DATABASE_URL`, restart all app replicas, verify migrations and quote status, then revoke the old credential.
- GitHub Packages token: grant only `read:packages`; use it as a build secret, never an image build argument or committed `.npmrc` value.

Log public addresses, opaque quote IDs, and transaction hashes only. Never log raw environments, decrypted notes, bearer tokens, or key material.

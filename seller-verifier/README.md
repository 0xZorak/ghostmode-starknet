# GhostMode seller verifier

This server holds the seller account signer and viewing key, discovers the exact incoming STRK20 note, and returns only an opaque note ID. It never returns notes or viewing-key material to the dapp. Because the current SDK setup requires an `Account`, this process has spending authority and must be isolated as a high-value service.

The service requires Node.js 24 and the official Privacy SDK from GitHub Packages. Grant GitHub CLI `read:packages`, then install without writing the token to disk:

```bash
gh auth refresh -h github.com -s read:packages
cd seller-verifier
export NODE_AUTH_TOKEN="$(gh auth token)"
npm install
unset NODE_AUTH_TOKEN
cp .env.example .env.local
npm run generate:viewing-key:write
```

The write command generates `SELLER_VIEWING_KEY` directly into `.env.local`, preserves mode `0600`, does not print the key, and refuses to replace an existing configured key. Put the remaining values in `.env.local`. Keep the viewing key permanently: changing it changes which private notes the seller can discover. Register the seller once, then start the verifier:

```bash
npm run register
npm start
```

Registration is a real Sepolia transaction. The chosen proving block must already include the seller account deployment and other transparent prerequisites. Do not register the same privacy identity twice.

The registration command is idempotent and performs a live funding preflight. It reads the current pool fee and Starknet gas prices, refuses to submit when the public balance cannot cover both caps, forwards proof facts explicitly, and skips the proof-less fee-estimation path that otherwise fails with `EMPTY_PROOF_FACTS`.

For local GhostMode testing, put these values in the app's root `.env.local`:

```dotenv
GHOSTMODE_SELLER_VERIFIER_URL=http://127.0.0.1:8787/verify-note
GHOSTMODE_SELLER_VERIFIER_TOKEN=<same random token as the verifier>
```

The checked-in Sepolia defaults use the public STRK20 prover at `https://transaction-prover.alpha-sepolia.sw-dev.io` and discovery service at `https://discovery-service.alpha-sepolia.sw-dev.io`. They are third-party test services, not ordinary Starknet RPC URLs, and should be health-checked before a demo. Production should pin and operate its trust boundary deliberately.

The pinned official SDK currently brings `starknet-devnet → decompress@4.2.1`, which npm flags for archive path-traversal vulnerabilities with no available fix. The verifier does not invoke devnet or archive extraction. Keep that tooling out of the production runtime, isolate the service, and upgrade when the official SDK removes or fixes the dependency; do not force an incompatible audit rewrite.

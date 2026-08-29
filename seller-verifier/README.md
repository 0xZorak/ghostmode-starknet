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
npm run generate:viewing-key
```

Put the generated `SELLER_VIEWING_KEY` and the remaining values in `.env.local`. Keep that key permanently: changing it changes which private notes the seller can discover. Register the seller once, then start the verifier:

```bash
npm run register
npm start
```

Registration is a real Sepolia transaction. The chosen proving block must already include the seller account deployment and other transparent prerequisites. Do not register the same privacy identity twice.

For local GhostMode testing, put these values in the app's root `.env.local`:

```dotenv
GHOSTMODE_SELLER_VERIFIER_URL=http://127.0.0.1:8787/verify-note
GHOSTMODE_SELLER_VERIFIER_TOKEN=<same random token as the verifier>
```

The proving and discovery URLs are supplied by the STRK20 operator. They are not ordinary Starknet RPC URLs and cannot be replaced with Alchemy.

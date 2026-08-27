# Seller verification

The verifier is an isolated Node 24 service in `seller-verifier/`. The browser and root app never receive seller viewing or signing material.

## Trust boundary

The service holds:

- seller Starknet account signer required by the current SDK setup;
- seller viewing key;
- proving/indexer/RPC configuration;
- a bearer token for the narrow `/verify-note` endpoint.

It listens on loopback by default. Put it behind authenticated TLS or a private service network. Do not expose `.env.local`, logs, crash dumps, or process inspection to the public app.

## Verification

The root app first verifies a successful `ReceiptAccepted` event from the exact gate with the exact request ID and resource commitment. The seller service then checks the configured seller, accepted transaction block, token, and amount, discovers incoming notes, and requires exactly one note with that amount created in that block. Zero matches remain pending; multiple matches fail as `ambiguous_seller_note`.

This is fail-closed, but not a cryptographic request ID inside the encrypted note. Equal same-block payments can cause an ambiguity and manual resolution. That limitation is explicit.

## Registration

`npm run register` builds at head minus ten, sends `tip: 0n`, and includes proof data whenever proof facts are present. Registration is a real Starknet transaction. Preserve the viewing key permanently and never regenerate it for an existing seller identity.

Health output reveals only network and viewing-only mode, not the seller address.

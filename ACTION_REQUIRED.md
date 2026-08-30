# Actions required from the project owner

This file contains only actions that cannot be completed safely without human authorization. Never commit or send a private key, seed phrase, viewing key, bearer token, or RPC credential.

## Open

### GM-ACT-001 — Authorize a dedicated Sepolia seller account

- Priority: P0
- Environment: Sepolia
- Reason: seller registration and live verification require a dedicated low-value account and wallet-authorized funding.
- Exact steps:
  1. Create a new Starknet Sepolia account that is not your primary wallet.
  2. Fund it with Sepolia STRK from a faucet.
  3. Store its address and private key only in `seller-verifier/.env.local` using the names in `seller-verifier/.env.example`.
  4. Reply only `done` and the public account address.
- Expected result: the public account exists and has enough testnet STRK for registration.
- What to return: public address and `done` only.
- Safety warning: never send the account private key or seed phrase.

### GM-ACT-003 — Authorize hosted infrastructure accounts

- Priority: P1
- Environment: Sepolia
- Reason: a public demo needs a Next.js host, durable database, and isolated long-running seller verifier.
- Exact steps:
  1. Connect the public GitHub repository to a server-capable frontend host such as Vercel.
  2. Create a managed Postgres database and an isolated container host such as Railway, Render, or Fly.io.
  3. Store generated credentials only in each provider's secret manager.
  4. Reply with the non-secret project/service names and `done`.
- Expected result: deployment targets exist and can receive repository builds.
- What to return: service names and public URLs only.
- Safety warning: never send hosting, database, or API tokens.

### GM-ACT-004 — Grant GitHub Packages read access locally

- Priority: P1
- Environment: Local development
- Reason: the public StarkWare Privacy SDK is distributed through GitHub Packages; the current GitHub CLI token returned HTTP 403 because it lacks `read:packages`.
- Exact steps:
  1. Run `gh auth refresh -h github.com -s read:packages` in your terminal.
  2. Complete GitHub's browser authorization.
  3. Do not display or copy the resulting token.
  4. Reply only `done`.
- Expected result: `gh auth status` succeeds and local package installation can access `@starkware-libs/starknet-privacy-sdk`.
- What to return: `done` only.
- Safety warning: never paste the GitHub token into chat or commit it to `.npmrc`.

### GM-ACT-005 — Restore GitHub Actions billing access

- Priority: P1
- Environment: GitHub
- Reason: push `f5fc22f` triggered workflow run `33224762551`, but GitHub refused to start both jobs because the account is locked due to a billing issue.
- Exact steps:
  1. Open the GitHub account/organization billing settings for `0xZorak/ghostmode-starknet`.
  2. Resolve the spending limit, payment method, or account lock shown by GitHub.
  3. Open Actions run `33224762551` and choose **Re-run all jobs**.
  4. Reply only `done` after both jobs have started.
- Expected result: the `application` and `receipt-gate` jobs run instead of being rejected before startup.
- What to return: `done` only; I can inspect the public run status.
- Safety warning: never send payment-card details, billing screenshots containing private data, or GitHub credentials.

## Completed

### GM-ACT-006 — Top up the Sepolia ReceiptGate deployer

- Completed: 2026-08-30
- Evidence: the current ReceiptGate was declared and deployed successfully; deploy transaction `0x036c4e5368c0ce234d94a67930b18030ab203d2273222c9b2cdb1f63d2dd5288` and read-only gate verification both succeeded.

### GM-ACT-000 — Generate the Sepolia quote-authority key

- Completed: 2026-08-29
- Evidence: gitignored `.secrets/quote-signer.env` exists with mode `0600`; the public-key field is present. Private material was not printed or committed.

### GM-ACT-002 — Complete buyer wallet privacy activation

- Completed: 2026-08-29
- Evidence: read-only `get_public_key` against Sepolia STRK20 pool `0x0254…0d91` returned a nonzero key for buyer `0x054af4bc9dd14a0ad081902c6685e4993075c5720fc66a85d1f1a6ff64066d2a`.

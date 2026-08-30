# Actions required from the project owner

This file contains only actions that cannot be completed safely without human authorization. Never commit or send a private key, seed phrase, viewing key, bearer token, or RPC credential.

## Open

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

### GM-ACT-007 — Provision compatible STRK20 proving and discovery services

- Priority: P0
- Environment: Sepolia infrastructure
- Reason: SDK registration and seller note discovery require a transaction prover and discovery service compatible with the deployed Sepolia pool. They are not ordinary Starknet RPC endpoints, and no public endpoints are published in the official SDK documentation.
- Exact steps:
  1. Ask the STRK20/CoreStars operator for Sepolia transaction-prover and discovery-service URLs compatible with Privacy SDK `0.14.3-rc.5`, or authorize a suitable remote host for the matching official containers.
  2. Store the resulting URLs only as `STRK20_PROVING_SERVICE_URL` and `STRK20_INDEXER_URL` in `seller-verifier/.env.local` or the host secret manager.
  3. Reply with only the non-secret service hostnames and `done`.
- Expected result: both services pass their documented health checks and seller registration can generate a proof.
- What to return: public service hostnames only; no credentials or viewing keys.
- Safety warning: proving and discovery requests handle privacy-sensitive material. Use HTTPS, matching releases, and operator-approved services; do not substitute a public RPC URL.

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

### GM-ACT-001 — Authorize a dedicated Sepolia seller account

- Completed: 2026-08-30
- Evidence: seller account `0x00402b00c42ab2c6910cb29a27f089246add3a5788a347f56da35489cbd17c1c` exists as an Argent account, its configured signer matches the onchain owner, and its read-only Sepolia STRK balance was approximately 3.34 STRK. The protected environment file has mode `0600`.

### GM-ACT-004 — Grant GitHub Packages read access locally

- Completed: 2026-08-30
- Evidence: GitHub device authorization completed for `0xZorak`; the pinned `@starkware-libs/starknet-privacy-sdk@0.14.3-rc.5` dependency installed successfully and verifier syntax checks pass.

### GM-ACT-006 — Top up the Sepolia ReceiptGate deployer

- Completed: 2026-08-30
- Evidence: the current ReceiptGate was declared and deployed successfully; deploy transaction `0x036c4e5368c0ce234d94a67930b18030ab203d2273222c9b2cdb1f63d2dd5288` and read-only gate verification both succeeded.

### GM-ACT-000 — Generate the Sepolia quote-authority key

- Completed: 2026-08-29
- Evidence: gitignored `.secrets/quote-signer.env` exists with mode `0600`; the public-key field is present. Private material was not printed or committed.

### GM-ACT-002 — Complete buyer wallet privacy activation

- Completed: 2026-08-29
- Evidence: read-only `get_public_key` against Sepolia STRK20 pool `0x0254…0d91` returned a nonzero key for buyer `0x054af4bc9dd14a0ad081902c6685e4993075c5720fc66a85d1f1a6ff64066d2a`.

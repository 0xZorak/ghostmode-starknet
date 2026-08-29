# Security policy

## Supported versions

GhostMode is pre-release software. Security fixes are applied only to the latest commit on the default branch; there are no supported stable releases yet.

## Reporting a vulnerability

Use GitHub's **Report a vulnerability** private reporting flow for the repository at <https://github.com/0xZorak/ghostmode-starknet/security/advisories/new> if that flow is enabled.

If private vulnerability reporting is not enabled, contact the repository owner through a private GitHub channel before sharing technical details. Do not open a public issue containing an exploit, private key, viewing key, bearer token, funded account, or unreleased patch.

The project does not currently publish a dedicated security email address. Repository owner action is required before claiming an email-based reporting channel.

## Sensitive information

Never include seed phrases, spending keys, viewing keys, quote-signing private keys, seller-verifier tokens, RPC credentials, `.env.local`, `.secrets/`, decrypted notes, or production transaction payloads in a report. Use redacted examples and arrange a private exchange if maintainers need more detail.

## Security scope

High-priority areas include privacy-policy downgrade, unauthorized or replayed ReceiptGate acceptance, incorrect note matching, release without both verification steps, key exposure, cross-network substitution, and mainnet safeguards that submit unexpectedly.

Availability issues, known metadata leakage, and limitations already documented in [`docs/limitations.md`](docs/limitations.md) may be out of scope unless they enable a new security impact.

## Responsible disclosure

Please allow maintainers reasonable time to reproduce, patch, test, and publish a fix before disclosure. The maintainers will acknowledge reports when possible, communicate scope and remediation, and credit reporters who request it and whose reports are valid.

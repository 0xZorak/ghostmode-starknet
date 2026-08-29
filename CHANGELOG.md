# Changelog

All notable changes to GhostMode will be documented here. The format follows the principles of Keep a Changelog; the project has not published a stable release.

## [Unreleased]

### Added

- Privacy requirement evaluation and deterministic disclosure score.
- STRK20 Wallet API action builders and wallet-keyless agent SDK.
- HTTP 402-style demo quote, signed ReceiptGate, and seller note verifier.
- Compatibility compiler for direct transfer, AVNU swap, receipt gate, and reviewed helper routes.
- Unit, mocked integration, and Cairo contract test suites.
- Security, deployment, API, privacy, and contributor documentation.

### Changed

- Server API routes now share server-only RPC override handling.
- Package and license metadata now identify GhostMode consistently.

### Security

- Private-route requests fail closed; no automatic public payment fallback.
- Receipt authorization is contract-domain-separated, expires, and is consumed once.

[Unreleased]: https://github.com/0xZorak/ghostmode-starknet/commits/main

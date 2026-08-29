# Contributing to GhostMode

GhostMode handles privacy claims and payment state. Changes should be small, reviewable, and explicit about their trust assumptions.

## Getting started

```bash
git clone https://github.com/0xZorak/ghostmode-starknet.git
cd ghostmode-starknet
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

See [`docs/quickstart.md`](docs/quickstart.md) for live-wallet prerequisites.

## Development environment

- Node.js 24 and npm 11
- Scarb 2.20.1 / Cairo 2.20.0 for contract work
- Starknet Foundry 0.63.0 and Universal Sierra Compiler 2.10.0 for contract tests
- A privacy-capable Starknet wallet only for manual public-network flows

## Repository structure

| Path | Purpose |
|---|---|
| `src/app/` | Next.js workbench and server routes |
| `src/lib/ghostmode/` | Public types, privacy policy, SDK, action builders, server verification |
| `cairo/` | ReceiptGate contract and tests |
| `seller-verifier/` | Isolated seller note-discovery service |
| `e2e/` | SDK integration tests with a mocked wallet |
| `docs/` | User, protocol, deployment, and security documentation |

## Development workflow

1. Create a branch, preferably `codex/<short-topic>` or `<username>/<short-topic>`.
2. Add or update tests with behavior changes.
3. Update privacy, API, configuration, and limitation docs when their contracts change.
4. Run `npm run check`; contract changes also require `cd cairo && scarb test`.
5. Keep real keys, account files, RPC secrets, and viewing material outside Git.

## Code style

TypeScript is strict. Prefer explicit domain types, pure decision functions, small server-only modules, and normalized Starknet felt comparisons. Public APIs should document whether they submit, what they return, and where keys live.

Cairo changes must preserve the exact `privacy_invoke` ABI expected by STRK20. Explain why authorization, replay, pool-caller, balance-delta, or open-note decisions exist. Do not label a new helper audited or production-ready.

## Testing requirements

```bash
npm run check
cd cairo
scarb test
```

The current integration suite mocks wallet proof/submission. For wallet-facing changes, record the wallet name/version, network, real transaction hash, and what was manually verified. Never insert a fake transaction hash.

## Documentation requirements

- Every new environment variable belongs in `.env.example` and `docs/configuration.md`.
- Every public endpoint belongs in `docs/api.md`.
- Every new error needs retry/funds-moved guidance in `docs/troubleshooting.md`.
- Every privacy claim must distinguish hidden, visible, counterparty-known, and out-of-scope data.
- Mainnet-spending commands must carry a real-funds warning.

## Commits and pull requests

Use imperative, scoped commit messages such as `Document seller verification boundary`. A pull request should state the problem, behavior change, tests run, privacy/security impact, network impact, and any manual follow-up. Avoid drive-by formatting in security-sensitive changes.

## Security-sensitive changes

Do not put vulnerability details in a public issue. Follow [`SECURITY.md`](SECURITY.md). Changes to receipt authorization, note matching, key custody, route selection, public fallback, or deployment safeguards need an explicit security review.

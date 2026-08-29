# Testing

GhostMode separates pure policy tests, SDK integration tests, contract tests, build checks, and manual public-network testing.

## One-command application check

```bash
npm run check
```

This runs:

1. `npm run typecheck`
2. `npm test`
3. `npm run test:e2e`
4. `npm --prefix seller-verifier run check`
5. `npm run build`

It does not run Cairo tests or a real wallet transaction.

## Unit tests

```bash
npm test
```

Seven files / 15 tests cover privacy routing and no-downgrade behavior, compatibility decisions, payment request validation, wallet action construction, quote authorization, exact gate-event verification, and quote release/replay state.

## SDK integration tests

```bash
npm run test:e2e
```

Three tests verify simulate-before-submit order, exact transfer/invoke action shape, safe failures for missing wallet/wrong network/expiry, and verification/status HTTP calls.

Despite the script name, this suite uses a mocked `WalletAccountV6`. It does not create a proof, contact STRK20 services, open a wallet extension, or submit to Starknet.

## Type and production build

```bash
npm run typecheck
npm run build
```

`lint` is currently an alias for TypeScript checking; ESLint/format enforcement is not configured.

## Seller service

```bash
npm --prefix seller-verifier run check
```

This performs JavaScript syntax checks only. The seller dependency install, registration, note discovery, and service-to-service flow require credentials/services and were not run in the documentation pass.

## Cairo tests

```bash
cd cairo
scarb test
```

Nine Starknet Foundry tests cover ReceiptGate success and failure paths. The manifest's test script points at repository-bundled Foundry/compiler binaries.

## Security tests represented

- Refusal when a privacy wallet is unavailable
- Refusal when general private-invoke requirements cannot be met
- No public fallback when privacy was requested
- Invalid/expired payment request rejection
- Zero recipient and expired quote rejection
- Exact contract/event/request/commitment verification
- Quote replay and duplicate ID protection
- Contract caller, pool placeholder, expiry, replay, malformed ID, and signature substitution rejection

## Network-dependent checks

These submit nothing:

```bash
node scripts/network-check.mjs sepolia
npm run mainnet:check
npm run mainnet:dry-run
```

The “dry run” is still a read-only configuration check; it cannot estimate a private transaction without a connected privacy wallet and prepared proof.

## Verified results: 2026-08-29

| Command | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm test` | 7 files, 15 tests passed |
| `npm run test:e2e` | 1 file, 3 mocked-wallet tests passed |
| `npm --prefix seller-verifier run check` | Passed syntax checks |
| `npm run build` | Passed; 1 page and 8 dynamic API routes built |
| `cd cairo && scarb test` | 9 passed, 0 failed |
| Sepolia read-only network check | RPC, pool, token passed; gate/verifier not configured |
| Mainnet read-only network check | RPC, pool, token passed; gate/verifier not configured |

## Manual live test still required

Use a supported wallet on Sepolia to verify registration, shield approval/deposit prompts, note maturity, balance consent, purchase proof simulation, submission, gate receipt, seller discovery, and resource release. Record real hashes in `strk20.json` only after actual Mainnet transactions touch the required pool.

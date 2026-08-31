# Testing

GhostMode separates pure policy tests, SDK integration tests, contract tests, build checks, and manual public-network testing.

## One-command application check

```bash
npm run check
```

This runs:

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run test:e2e`
5. `npm --prefix seller-verifier run check`
6. `npm run build`

It does not run Cairo tests or a real wallet transaction.

## Unit tests

```bash
npm test
```

Twelve files / 28 tests cover privacy routing and no-downgrade behavior, compatibility decisions, payment request integrity, wallet action construction, quote authorization, exact gate-event verification, quote release/replay state, agent policy/orchestration, boundary validation, rate limiting, and seller note-ID matching.

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

`lint` runs Biome's recommended JavaScript/TypeScript/React rules. Existing low-priority warnings are reported but do not hide errors; TypeScript is a separate gate.

## Seller service

```bash
npm --prefix seller-verifier run check
```

This performs JavaScript syntax checks only. Exact note matching is unit-tested by the root test suite. Seller dependencies are installed, the dedicated Sepolia seller registered successfully, and the local service health check passes. Incoming-note discovery and service-to-service release still require the first real private payment.

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

## Verified results: 2026-08-31

| Command | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm test` | 12 files, 28 tests passed |
| `npm run test:e2e` | 1 file, 3 mocked-wallet tests passed |
| `npm --prefix seller-verifier run check` | Passed syntax checks |
| `npm run build` | Passed; 2 static pages and 8 dynamic API routes built |
| `cd cairo && scarb test` | 9 passed, 0 failed |
| Sepolia read-only network check | RPC, pool, token passed; gate/verifier not configured |
| Mainnet read-only network check | RPC, pool, token passed; gate/verifier not configured |
| Fresh clone of `f5fc22f` | `npm ci` found 0 vulnerabilities; `npm run check` passed |
| GitHub Actions run `33224762551` | Jobs did not start: account locked due to a GitHub billing issue |
| Sepolia seller registration | Accepted on L2: `0x2c76c13721b239bdd0bf6d25e59ecceb0b6fd464142ad27ba4bd3ba4ede0782` |
| Seller verifier health | Passed locally on the registered Sepolia identity |

## Manual live test still required

Use a supported wallet on Sepolia to verify registration, shield approval/deposit prompts, note maturity, balance consent, purchase proof simulation, submission, gate receipt, seller discovery, and resource release. Record real hashes in `strk20.json` only after actual Mainnet transactions touch the required pool.

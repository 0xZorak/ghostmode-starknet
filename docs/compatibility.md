# Compatibility

This table records the versions present and tested locally on 2026-08-29. Wallet and STRK20 service compatibility changes independently; runtime capability checks remain required.

| Component | Version | Verification/notes |
|---|---|---|
| Node.js | 24.11.1 | Local `node --version`; `.nvmrc` requires major 24. |
| npm | 11.6.2 | Local and `packageManager`. |
| Next.js | 16.3.2 installed | Production build passed; `package.json` range begins at 16.0.8. |
| React | 19.2.1 | Root lock/install. |
| TypeScript | 5.9.3 | `npm run typecheck` passed. |
| Vitest | 3.2.7 | 15 unit + 3 mocked integration tests passed. |
| starknet.js | 10.4.0 | Exact root pin; provides `WalletAccountV6` STRK20 methods. |
| Wallet discovery | 6.0.3 | Exact `get-starknet-discovery` and wallet-standard pins. |
| Wallet API types | 0.10.3 | Exact root pin and minimum runtime check. |
| Privacy SDK | 0.14.3-rc.5 declared | Seller service only; GitHub release confirms RC.5. Runtime install/live path not verified locally. |
| Seller starknet.js | 10.5.0 declared | Matches Privacy SDK RC.5 dependency; seller install not verified locally. |
| Scarb | 2.20.1 | Local tool output. |
| Cairo | 2.20.0 | Local Scarb tool output and manifest dependency. |
| Starknet Foundry | 0.63.0 | Bundled `./.tools/bin/snforge`; 9 tests passed. |
| Universal Sierra Compiler | 2.10.0 | Bundled binary; used by the Scarb test script. |
| Privacy wallet | Runtime check required | Must report Wallet API 0.10.3+. Brand alone is insufficient. No live wallet flow verified in this documentation pass. |

## Route support

| Action | Network in registry | Status |
|---|---|---|
| Encrypted private transfer | Sepolia/Mainnet | Ready in code; needs compatible wallet, registered participants, mature notes, and live test. |
| Receipt-gated payment | Sepolia/Mainnet | Adapter implemented; current contract/service configuration required. |
| AVNU private swap | Mainnet | Registry points to upstream-supported route; GhostMode does not implement the AVNU SDK call itself. |
| Lending/escrow/custom helper | Sepolia/Mainnet | Reference-only compatibility report; requires reviewed app-specific Cairo. |
| Hidden arbitrary calldata/state | None | Unsupported. |
| More than one external invoke | None | Unsupported by this STRK20 action model. |

## Network constants checked

Read-only checks on 2026-08-29 confirmed that the configured pool and STRK token addresses have contract classes on both `SN_SEPOLIA` and `SN_MAIN`. These checks do not prove wallet support, privacy service availability, audit status, correct economic configuration, or a working GhostMode deployment.

Before release, verify current official [STRK20 docs](https://strk20.starknet.io/docs), [Starknet Privacy releases](https://github.com/starkware-libs/starknet-privacy/releases), wallet capability, package compatibility, pool addresses, and service endpoints.

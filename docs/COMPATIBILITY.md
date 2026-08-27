# Compatibility

The pinned set was verified against installed type declarations and current upstream release metadata on 27 August 2026.

| Component | Version | Reason |
|---|---:|---|
| Node.js | 24.x | Required by the Privacy SDK RC and used by server tooling |
| npm | 11.6.2 | Lockfile owner and reproducible root install |
| Next.js | lockfile-resolved 16.3.2 | Current production build in this repository |
| React | 19.2.1 | Matches Next application |
| starknet.js browser | 10.4.0 | Tested WalletAccountV6 STRK20 API baseline |
| Wallet discovery / standard | 6.0.3 | Pinned adjacent Wallet Standard stack |
| Wallet API types | 0.10.3 | Matches browser STRK20 action types |
| Privacy SDK | 0.14.3-rc.5 | Current GitHub Packages RC used only by seller service |
| starknet.js seller service | 10.5.0 | SDK RC.5 pinned peer/runtime line |
| Scarb | 2.20.1 | Local contract build tool |
| Cairo compiler | 2.20.0 | Matches contract dependency line |
| Starknet Foundry | 0.63.0 | Contract test runner and `snforge_std` |
| `snforge_std` | 0.63.0 | Matches Foundry binary |

Root and seller dependencies intentionally use different starknet.js patch versions because the Wallet API baseline and Privacy SDK RC pin adjacent releases. They are separate processes and must not share bundled runtime objects.

The Privacy SDK is distributed through GitHub Packages rather than public npm. Authenticate only during installation and never commit a package token. Root `package-lock.json` is committed; `seller-verifier` should commit its own lockfile after authenticated install in the deployment environment.

Run `npm run typecheck`, contract build/tests, and the official freshness script in the installed STRK20 skills before upgrading. Do not accept a major/RC upgrade merely because it is newer: verify `WalletAccountV6`, action placeholders, `provingBlockId`, `proofFacts` plus proof data, `tip: 0n`, note discovery map key types, and pool ABI first.

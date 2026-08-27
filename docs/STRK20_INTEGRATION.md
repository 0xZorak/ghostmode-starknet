# STRK20 integration

## Browser route

GhostMode uses `WalletAccountV6` from `starknet.js 10.4.0`. The privacy-enabled wallet owns viewing keys, discovers notes, prepares proofs, and submits:

- `strk20InvokeTransaction([{ type: "deposit", ... }])` for shield;
- `strk20Balances(tokens)` for private balances;
- an encrypted `transfer` for private payment;
- one `transfer` plus one `invoke` for the atomic receipt flow.

GhostMode never asks the browser wallet for a viewing key.

## Private invoke boundary

STRK20 permits one external invoke in a pool transaction. The helper must expose `privacy_invoke`, pin and validate the pool caller, and return the exact `Span<OpenNoteDeposit>` ABI. Open notes necessarily expose token and amount. Arbitrary target calldata and public contract storage do not become private.

## Lower-level SDK route

Only `seller-verifier/` imports `@starkware-libs/starknet-privacy-sdk 0.14.3-rc.5`. It runs on Node 24, sets `provingBlockId` to head minus ten, submits with `tip: 0n`, and includes both `proofFacts` and proof data when facts exist. The service is isolated because it holds seller discovery material.

## Network configuration

- Mainnet pool: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
- Sepolia pool: `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`
- STRK token: `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`

Addresses are centralized in `src/utils/constants.ts` and separated by network. Run the read-only scripts before relying on them.

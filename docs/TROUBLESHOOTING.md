# Troubleshooting

Every recovery starts with one rule: **if a wallet may have submitted, do not retry until Activity and onchain evidence are checked.**

| Failure | Likely cause | Funds / retry safety | Recovery |
|---|---|---|---|
| Wallet not detected | Extension disabled or unsupported browser | No submission; safe | Enable a Wallet Standard Starknet extension and reload |
| Unsupported wallet / privacy API missing | Wallet lacks STRK20 Wallet API 0.10.3+ | No submission; safe | Update or switch privacy-compatible wallet |
| Wrong chain | Wallet and quote/build differ | GhostMode refuses; safe | Switch to exact `SN_SEPOLIA` or `SN_MAIN` and reconnect |
| `NOT_REGISTERED` | Wallet privacy identity not activated | Usually no deposit | Complete native wallet Privacy/Shield registration once |
| Insufficient public STRK | Amount plus fee allowance unavailable | No submission if confirm disabled | Fund the connected address; confirm RPC and wallet show same network |
| Insufficient private balance | Notes missing, immature, or spent | Simulation should fail; safe | Read shielded balance, wait maturity, then rebuild quote |
| Proof generation failed | Prover unavailable, stale notes, version mismatch | No hash means usually no submission | Refresh private balance, verify compatibility, retry only after Activity check |
| Discovery failed | Indexer/OHTTP/RPC unavailable | No payment should be assumed | Restore service and rediscover; never infer zero balance from failure |
| Wallet timeout | Extension returned no hash | **Uncertain** | Check Activity, GhostMode recovery, gate event, and Voyager before retrying |
| Contract revert | Bad pool, signature, expiry, replay, or ABI | Atomic transaction reverts; private transfer should revert too | Read revert code, request a new signed quote, never reuse consumed ID |
| Payment expired | Clock/quote lifetime elapsed | No safe submission | Request a fresh quote; do not alter expiry because signature binds it |
| Payment already used | Onchain/server replay state consumed | Do not pay again | Query `/api/payment/:id`; obtain a new request for a new purchase |
| Quote signer mismatch | Server private key and gate public key differ | Quote cannot execute | Compare `/api/health`, rotate secrets or deploy correct gate |
| Seller note not found | Note not indexed/mature or wrong seller/token/amount | Payment may be accepted; do not repay | Retry verification after discovery catches up |
| Ambiguous seller note | Multiple equal notes in accepted block | Resource stays locked | Resolve manually; future protocol payment tags remove ambiguity |
| Node mismatch | Node below 24 | SDK/server may fail | Use `.nvmrc`, reinstall dependencies |
| starknet.js mismatch | Unpinned transitive upgrade | Wallet actions/type errors | Restore lockfile and versions in `COMPATIBILITY.md` |
| Scarb/Cairo failure | Tool/dependency version mismatch | No chain effect | Use documented versions, run `scarb build`, then `scarb test` |
| Sepolia/Mainnet RPC unavailable | Provider outage/key error | Status uncertain | Use a trusted alternate RPC; verify chain ID before continuing |

Raw provider errors may contain implementation details and are not returned by health or unlock APIs. Inspect server logs locally while preserving the logging policy in `SECURITY.md`.

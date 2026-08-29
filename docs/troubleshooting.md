# Troubleshooting and errors

The first recovery rule is: **if a wallet may have submitted, do not retry until wallet Activity and onchain evidence are checked.** A fail-closed UI does not always mean funds stayed put.

## Wallet is not detected

**Symptom:** picker shows no wallet.<br>
**Cause:** extension disabled, unsupported browser/profile, or Wallet Standard registration failed.<br>
**Check:** confirm the extension is enabled in this browser profile and reload.<br>
**Fix:** install/update a Starknet Wallet Standard extension. No transaction was submitted; retrying connection is safe.

## Wallet API is missing

**Symptom:** `WALLET_NOT_PRIVACY_CAPABLE` or API below 0.10.3.<br>
**Cause:** wallet/build does not expose STRK20 dApp methods.<br>
**Check:** inspect the version shown after connection; do not use balance access as a capability probe.<br>
**Fix:** update or switch wallet. No transaction was prepared by GhostMode.

## Wrong network

**Symptom:** `WRONG_NETWORK` or “Switch to Starknet Sepolia/Mainnet.”<br>
**Cause:** wallet, SDK, quote, or configured build targets differ.<br>
**Check:** compare chain ID and quote `chainId`.<br>
**Fix:** switch to the exact chain and reconnect. GhostMode refuses before submission.

## Privacy is not registered

**Symptom:** `NOT_REGISTERED` or balance access says privacy is inactive.<br>
**Cause:** the account has not published its STRK20 viewing-key registration for this pool.<br>
**Check:** open the wallet's native privacy screen.<br>
**Fix:** complete wallet registration/first native privacy action, wait until finalized state includes it, then retry. Only the user/wallet can register its identity.

## Insufficient public STRK

**Symptom:** wallet disables confirmation or reports insufficient balance.<br>
**Cause:** shield amount plus fee allowance does not fit, or wallet and RPC show different chain/account state.<br>
**Check:** compare connected address, chain, public RPC balance, wallet balance, and selected fee token.<br>
**Fix:** fund the exact Sepolia account, switch away/back to refresh, and reconnect. A disabled confirmation means no submission.

## Private balance is zero

**Symptom:** no spendable shielded balance after deposit.<br>
**Cause:** deposit not accepted, discovery lag, wrong viewing identity/token/pool, or note not mature.<br>
**Check:** public deposit event, wallet Activity, pool/network, and balance consent.<br>
**Fix:** wait roughly ten blocks, refresh discovery, and preserve the same viewing identity. Do not reshield until the first attempt is resolved.

## Proof generation or discovery fails

**Symptom:** wallet/prover/indexer error before a hash.<br>
**Cause:** stale state, immature note, unavailable service, version mismatch, or proving base before prerequisite state.<br>
**Check:** wallet Activity, current versions, note age, RPC/prover/indexer health.<br>
**Fix:** refresh private state and rebuild only after prerequisites are finalized. If no submission prompt/hash occurred, retrying preparation is normally safe; still inspect Activity after wallet timeouts.

## Wallet timed out before returning a hash

**Symptom:** timeout and no hash.<br>
**Cause:** extension, proving, paymaster, or RPC exceeded the client wait.<br>
**Check:** wallet Activity, GhostMode “Recover pending shield,” public deposit event, ReceiptGate event, and explorer.<br>
**Fix:** if evidence exists, do not resubmit; wait for maturity/verification. If wallet shows explicit rejection and no evidence appears, clear/retry deliberately. Outcome is uncertain until checked.

## Hash returned but confirmation timed out

**Symptom:** “Submitted; confirmation could not be verified yet.”<br>
**Cause:** selected RPC has not indexed the relayed hash.<br>
**Check:** explorer and a second trusted RPC.<br>
**Fix:** keep polling the same hash. Never resubmit the payment.

## ReceiptGate reverted

**Symptom:** `BAD_POOL`, `ZERO_QUOTE`, `ZERO_COMMITMENT`, `QUOTE_EXPIRED`, `QUOTE_REPLAY`, or `BAD_SELLER_AUTH`.<br>
**Cause:** wrong deployment/calldata, expired or reused quote, or signer mismatch.<br>
**Check:** gate pool/key views, quote expiry/signature, exact chain and contract.<br>
**Fix:** correct configuration and request a fresh signed quote. The atomic payment actions revert with the gate, though a reverted Starknet transaction may still charge a fee.

## Seller note is not found

**Symptom:** `seller_note_not_found`.<br>
**Cause:** indexer delay, wrong seller/token/amount, or wrong transaction block.<br>
**Check:** gate receipt first, then verifier configuration and discovery health.<br>
**Fix:** retry verification after discovery catches up. Payment may already have moved; do not repay.

## Seller note is ambiguous

**Symptom:** `ambiguous_seller_note`.<br>
**Cause:** more than one equal-token/equal-amount note was created for the seller in the accepted block.<br>
**Check:** isolated verifier logs and transaction evidence without exposing notes publicly.<br>
**Fix:** manual resolution is required. Do not release or repay automatically.

## Node, build, or Cairo mismatch

**Symptom:** WebCrypto/import errors, TypeScript drift, Scarb plugin failure, or Sierra compiler errors.<br>
**Cause:** versions differ from [compatibility](compatibility.md) or dependencies are stale.<br>
**Check:** `node --version`, `npm --version`, `scarb --version`, bundled tool versions, lockfile state.<br>
**Fix:** `nvm use`, `npm ci`, then rerun `npm run check`; use the documented Cairo tools and `scarb test`.

## Central error catalogue

| Error/status | Meaning | Funds may have moved? | Safe next action |
|---|---|---:|---|
| `INVALID_INTENT` / `INVALID_PRIVACY_INTENT` | Invalid typed privacy request | No | Correct input |
| `PRIVATE_ROUTE_UNAVAILABLE` | Requested privacy cannot be met | No | Change capability/route, not silently requirements |
| `UNSUPPORTED_ACTION` | No reviewed route | No | Add/review an adapter |
| `INVALID_PAYMENT_REQUEST` | Invalid/expired V1 request | No | Get a fresh valid request |
| `QUOTE_SIGNER_NOT_CONFIGURED` | Server cannot create signed quote | No | Configure server secret |
| `QUOTE_SIGNER_KEY_MISMATCH` | Private/public quote keys differ | No | Correct keys/gate binding |
| `PAYMENT_ALREADY_EXISTS` | Duplicate in-memory quote ID | No new payment | Generate a new random ID |
| `PAYMENT_ALREADY_USED` | Quote already verified/released | Yes | Read status; do not repay |
| `PAYMENT_VERIFICATION_IN_PROGRESS` | Different hash owns claim | Possibly | Poll, do not repay |
| `receipt_gate_not_verified` | Exact gate event absent/invalid | Uncertain | Inspect supplied transaction |
| `seller_verifier_not_configured` | Private note cannot be checked | Possibly | Configure verifier; retry verification |
| `seller_verifier_http_*` | Verifier HTTP failure | Possibly | Restore service; retry verification |
| `verification_failed` | Receipt lookup/check failed | Uncertain | Retry verification only |
| `PAYMENT_NOT_FOUND_OR_EXPIRED` | Local quote missing | Unknown | Reconcile chain/store manually |

Raw provider errors can contain sensitive details. Keep them in restricted logs and follow [security logging guidance](security.md#logging).

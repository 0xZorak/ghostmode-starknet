# Sepolia testnet runbook

GhostMode defaults to `SN_SEPOLIA` and refuses to submit a quote from any other connected network.

## Current configuration

- Chain: Starknet Sepolia (`SN_SEPOLIA`)
- STRK20 v2 privacy pool: `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`
- Payment asset: Sepolia STRK
- Wallet route: STRK20 Wallet API

Re-check the pool address against the current STRK20 documentation immediately before deployment.

## Setup

1. Copy `.env.example` to `.env.local` and add an Alchemy key.
2. Keep `NEXT_PUBLIC_GHOSTMODE_NETWORK=sepolia`.
3. Use a privacy-enabled wallet on Sepolia and obtain enough public Sepolia STRK for both the shield amount and the wallet's displayed fee allowance. The current 1 STRK test may reserve up to 2 additional STRK in the confirmation screen, so keep more than 3 STRK available before starting.
4. After a faucet top-up, wait at least 10 blocks before shielding. If the wallet still reports insufficient STRK while GhostMode's public balance is sufficient, cancel the prompt, cycle the wallet network, reload the dapp, and reconnect the same account. A native-wallet shield distinguishes a wallet/prover problem from dapp wiring.
5. Register the seller account with STRK20 so it can receive private notes.
6. Deploy `cairo/src/lib.cairo` with the Sepolia pool address as its constructor argument.
7. Set `NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA` and `NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA`, then restart Next.js.
8. Configure `GHOSTMODE_SELLER_VERIFIER_URL` and `GHOSTMODE_SELLER_VERIFIER_TOKEN` using the interface in `docs/SELLER_VERIFIER.md`. Without it, payment testing works but resource delivery safely remains locked.

Before opening the wallet, run:

```bash
npm test
npm run typecheck
npm run build
curl http://localhost:3000/api/readiness

cd cairo
scarb build
```

The readiness response separates shield testing, private-purchase testing and resource-unlock testing. Do not treat one green tier as proof that the next tier is configured.

## Wallet timeouts

A wallet timeout is not evidence that a transaction failed. The wallet can submit a
relayed transaction and time out before returning its hash. Never immediately click
Shield or Pay again.

GhostMode snapshots the latest accepted block before submission. If the wallet times
out, it polls only later blocks and recovers:

- a shield by matching the pool's `Deposit` event on account, token and exact amount;
- a purchase by matching ReceiptGate's `ReceiptAccepted` event on quote ID and resource commitment.

If recovery finds no event, check wallet Activity and read the shielded balance before
retrying. If a hash was returned but the RPC cannot confirm it, GhostMode preserves the
hash and links to Voyager instead of reporting a failed transaction.

GhostMode also stores the block immediately before a shield request in local browser
storage. A timed-out request remains marked as pending across reloads. Use **Recover
pending shield** to search later blocks; do not create another deposit while that marker
exists. Clear the marker only after wallet Activity confirms the request was rejected or
cancelled.

## End-to-end checks

1. Inspect `/api/demo-intel` and confirm the quote says `SN_SEPOLIA`.
2. Shield STRK. The wallet should request approval, then deposit.
3. Wait roughly ten blocks for the new note to mature.
4. Read the shielded balance from the wallet.
5. Execute the purchase. GhostMode first asks the wallet to prove and simulate, then asks for submission.
6. Confirm the transaction succeeded in Sepolia Voyager.
7. Confirm ReceiptGate emitted `ReceiptAccepted` and `is_consumed(quote_id)` is true.
8. Confirm seller note discovery sees the expected token and amount.
9. POST the quote ID and transaction hash to `/api/demo-intel/unlock`; confirm the committed resource is returned only after seller verification.
10. Confirm replaying the quote, using an expired quote, and calling the gate directly all revert.

Sepolia transactions never belong in `strk20.json`; the sprint registry only counts mainnet pool transactions.

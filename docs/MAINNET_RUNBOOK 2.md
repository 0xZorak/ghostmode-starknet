# Mainnet runbook

Run every check in `TESTNET_RUNBOOK.md` on Sepolia first. Mainnet promotion is a deliberate configuration change, not an automatic fallback.

## Preconditions

1. Verify the current STRK20 mainnet pool address from an official source.
2. Confirm the selected wallet's current STRK20 Wallet API support.
3. Register the seller with the pool.
4. Ensure the buyer-to-seller channel and STRK token subchannel can be set up.
5. Compile, review and deploy ReceiptGate with the pool address.
6. Set `NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET` and `NEXT_PUBLIC_GHOSTMODE_SELLER_MAINNET`.
7. Set `NEXT_PUBLIC_GHOSTMODE_NETWORK=mainnet` only after the deployed addresses and seller registration are independently verified.
8. Keep the Alchemy key in `.env.local` or deployment secrets.

## Required demonstration transactions

1. Shield STRK into the buyer's balance.
2. Make a normal private transfer to establish or demonstrate the agent funding route.
3. Execute the private purchase with ReceiptGate in the same pool transaction.

Put the accepted transaction hashes in `strk20.json`. Never add a testnet hash or a transaction that did not touch the official mainnet pool.

## Verification

- Receipt execution status is `SUCCEEDED`.
- ReceiptGate emitted `ReceiptAccepted` for the expected opaque quote ID.
- `is_consumed(quote_id)` returns true.
- Seller note discovery finds the expected token and amount.
- Reusing the quote ID reverts.
- An expired quote reverts.
- Direct invocation outside the pool reverts.

## Release gate

Do not enable encrypted-key release until seller-side note discovery verifies the received note. A ReceiptGate event by itself is not payment proof.

# Threat model

## Protected property

GhostMode's current protected property is the public onchain payment graph of an autonomous agent. A normal STRK20 transfer is intended to conceal the sender, receiver, token, amount and spent-note linkage from public observers.

## Observers

### Public chain observer

Can observe registrations, deposits, withdrawals, timing, pool calls, opaque ReceiptGate events and nullifiers. It should not be able to reconstruct the internal normal-note transfer from the owner or agent to the seller.

### Seller

Sees the HTTP request, resource requested, quote, delivery timing and potentially the client's IP address. After note discovery, the seller also learns that it received the payment and can decrypt its amount and token.

### Wallet, prover, relayer and discovery service

These are separate trust boundaries. Their exact visibility depends on the selected STRK20 route and deployment. A production headless runner should use HTTPS, pinned configuration and OHTTP where supported, while recognising that a discovery service may still process request contents.

### GhostMode operator

The browser application does not request a viewing key. A future server-side agent runner would hold keys and therefore becomes a high-value custodian requiring isolation, rotation, access controls and incident response.

## Known leakages

- Deposits reveal depositor, token and amount.
- Withdrawals reveal destination, token and amount.
- Timing and distinctive values can shrink the anonymity set.
- Opening a channel near a payment can create correlation.
- HTTP and network metadata are not concealed by STRK20.
- ReceiptGate publishes an opaque quote ID and resource commitment.
- The current commitment proves byte identity only, not semantic quality.

## Contract limitations

- ReceiptGate cannot inspect the encrypted recipient or amount.
- A gate event alone is not sufficient evidence that the seller received the quoted payment.
- The seller must discover the private note and verify its token and amount before releasing a key.
- Contract source is unaudited and must not custody funds.
- The helper stores only replay status.

## Failure behavior

- Invalid or expired quote: do not submit.
- ReceiptGate revert: the enclosing STRK20 transaction reverts atomically.
- Wallet does not support STRK20: stop and name the capability failure.
- Seller registration or channel setup missing: stop and surface the wallet error.
- Unlock verification unavailable: do not release encrypted content.


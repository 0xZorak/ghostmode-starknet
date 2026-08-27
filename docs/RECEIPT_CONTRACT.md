# ReceiptGate contract

`cairo/src/lib.cairo` is a narrow STRK20 anonymizer helper. It does not transfer tokens itself. The wallet supplies two actions in one private pool transaction: encrypted transfer to the seller, then `privacy_invoke` on ReceiptGate. Any gate revert reverts the entire pool transaction.

## Constructor

1. Verified STRK20 pool address
2. Seller quote-authority Stark public key

Both must be nonzero. The authority key is not the seller payment address and does not spend funds.

## Authorization message

The seller signs Poseidon over:

```text
[receipt_gate_address, request_id, resource_commitment, valid_until]
```

Contract-address domain separation prevents reuse on another gate. Changing the request ID, commitment, or expiry invalidates the signature.

## State and events

Only the pinned pool, public authority key, and `consumed[request_id]` map are stored. `ReceiptAccepted(request_id, resource_commitment)` is public. Buyer, payment recipient, token, and amount are absent.

## Rejections

Zero pool/authority, non-pool caller, wrong pool placeholder, zero request/commitment, expired request, replay, and bad seller signature all revert. Consumption occurs only after every check.

## Tests

Nine Starknet Foundry cases cover valid execution, exact expiry, unauthorized caller, pool substitution, expiration, replay, malformed IDs, independent requests, and forged/cross-request seller authorization.

ReceiptGate proves seller authorization and one-time atomic acceptance. It cannot decrypt the payment note; resource release still requires seller discovery.

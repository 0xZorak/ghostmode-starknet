# ReceiptGate contract

[`cairo/src/lib.cairo`](../cairo/src/lib.cairo) is a narrow STRK20 anonymizer helper. It does not transfer or decrypt payment tokens. The pool performs an encrypted transfer to the seller and then calls the gate in the same transaction.

## Constructor

```cairo
fn constructor(
    ref self: ContractState,
    pool: ContractAddress,
    seller_authority_key: felt252,
)
```

- `pool`: exact STRK20 pool allowed to call `privacy_invoke`.
- `seller_authority_key`: Stark-curve public key for quote authorization; it is not a payment or spending key.

Both values must be nonzero. The contract has no upgrade or authority-rotation function; rotation requires a new deployment and application migration.

## Public interface

| Function | Mutates | Purpose |
|---|---:|---|
| `privacy_invoke(...)` | Yes | Validate and consume one seller-authorized opaque quote. Called only by the pinned pool. |
| `is_consumed(quote_id)` | No | Read replay state. |
| `get_pool()` | No | Read pinned pool. |
| `get_seller_authority_key()` | No | Read pinned authorization key. |

### `privacy_invoke`

```cairo
fn privacy_invoke(
    ref self: ContractState,
    pool_address: ContractAddress,
    quote_id: felt252,
    resource_commitment: felt252,
    valid_until: u64,
    authorization_r: felt252,
    authorization_s: felt252,
) -> Span<OpenNoteDeposit>
```

The first argument is the wallet placeholder `${poolAddress}`. ReceiptGate checks both the caller and this value against storage so substituted calldata cannot redirect the authorization context.

The return type must exactly match the STRK20 helper ABI:

```cairo
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}
```

ReceiptGate returns an empty span because the preceding transfer action already created the encrypted seller note; no helper output needs an open note.

## Authorization

The server and contract compute Poseidon over:

```text
[receipt_gate_address, quote_id, resource_commitment, valid_until]
```

Including the gate address provides cross-contract domain separation. Modifying the quote ID, commitment, expiry, or destination gate invalidates the signature.

## State and event

Storage contains the pinned pool, authority public key, and `consumed[quote_id]`. Successful invocation sets the quote consumed and emits:

```cairo
ReceiptAccepted { quote_id, resource_commitment }
```

These values and the transaction timing are public. Buyer, seller-recipient, token, and amount are not contract parameters or event fields.

## Revert catalogue

| Cairo error | Condition | Atomic effect |
|---|---|---|
| `ZERO_POOL` | Constructor pool is zero | Deployment reverts |
| `ZERO_AUTHORITY` | Constructor authority key is zero | Deployment reverts |
| `BAD_POOL` | Caller or supplied pool differs from pinned pool | Entire STRK20 transaction reverts |
| `ZERO_QUOTE` | Quote ID is zero | Entire transaction reverts |
| `ZERO_COMMITMENT` | Resource commitment is zero | Entire transaction reverts |
| `QUOTE_EXPIRED` | Block timestamp is later than `valid_until` | Entire transaction reverts |
| `QUOTE_REPLAY` | Quote ID is already consumed | Entire transaction reverts |
| `BAD_SELLER_AUTH` | Stark signature is invalid | Entire transaction reverts |

Reverted Starknet transactions may still incur a fee even though state/payment actions revert.

## Security properties and limits

ReceiptGate proves that the configured quote authority approved one request for this gate before expiry and that the request was accepted once by the pinned pool. It does not prove the encrypted transfer's recipient, token, amount, delivery, or resource truth. The server therefore also requires seller-note discovery before release.

The contract has not been audited. A historical Sepolia deployment in `cairo/address.md` predates this ABI and must not be configured.

## Tests

`scarb test` runs nine Starknet Foundry cases: success, exact-expiry boundary, unauthorized caller, pool substitution, expired request, replay, malformed IDs, independent requests, and forged/cross-request signatures.

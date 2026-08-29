# Privacy model

GhostMode distinguishes cryptographic confidentiality from UI masking, server secrecy, and network anonymity. A property is private only when the selected STRK20 route supports it.

## STRK20 mental model

- A normal note contains an owner, token, and `u128` amount in encrypted form.
- Spending consumes whole notes and publishes an unlinkable nullifier; change becomes a new note.
- A viewing key can discover and decrypt a user's notes but cannot spend them.
- A private wallet manages viewing keys, channels, note discovery, proof construction, and submission.
- Open notes are different: their token and amount are public so a helper can determine an output at execution time.
- Deposits and withdrawals cross the privacy boundary and are public.

## Guarantee matrix

| Category | Surface | Explanation |
|---|---|---|
| Private | In-pool payer-to-recipient relationship | A normal private transfer creates an encrypted note rather than a public account-to-account transfer. |
| Private | Encrypted-note token and amount | These fields are encrypted for a normal note. |
| Private | Consumed-note linkage | The proof validates ownership and balance; a nullifier marks the spend without publishing the note link. |
| Counterparty-known | Seller's received token and amount | A recipient can decrypt its own payment. |
| Public | Registration activity | Viewing-key registration exists onchain, though the private key is not public. |
| Public | Shield deposit | Depositor, token, amount, pool, and timing are visible. |
| Public | Unshield withdrawal | Recipient, token, amount, pool, and timing are visible. |
| Public | Pool transaction and timing | STRK20 use, ordering, and block timing are observable. |
| Public | Private-invoke helper and calldata | Calling through STRK20 does not make general Starknet calldata confidential. |
| Public | Target state and events | Public contract storage and emitted events remain public. |
| Public | Open-note token and amount | Required by the open-note design. |
| Out of scope | HTTP, IP, RPC, cookies, wallet fingerprint | These require separate transport and operational protections. |
| Out of scope | Compromised wallet or host | Software controlling the keys can reveal or misuse them. |

## GhostMode purchase disclosure

The flagship purchase uses a normal encrypted transfer plus one public ReceiptGate invoke. The payment note hides the in-pool buyer/seller relationship, token, and amount from public observers. ReceiptGate publicly exposes:

- its own address;
- an opaque random quote ID;
- the resource commitment;
- expiry;
- seller authorization signature;
- transaction timing;
- `ReceiptAccepted(quote_id, resource_commitment)`.

The seller knows its own received payment and the HTTP request. The current same-block note matcher also receives the expected seller, token, amount, and transaction hash from the root server.

## Entry and exit leakage

Shielding should happen separately and ahead of private spending. Combining or tightly timing a distinctive public deposit and a later private action can shrink the practical anonymity set. The same applies to distinctive amounts and rapid unshielding. GhostMode cannot remove this protocol boundary.

## Channel and setup leakage

Both private-transfer participants must be registered. Opening a channel and immediately transferring can add timing correlation. Wallet-managed setup reduces application access to key material but does not make setup timing invisible.

## Compliance boundary

The STRK20 design includes deposit screening and escrow of viewing-key material to an auditor key at registration. Screening does not make deposits private. A viewing key can read but cannot spend. GhostMode does not operate or bypass the screening/auditor system and must not promise immunity from lawful selective disclosure.

## Privacy score

The score implemented in `privacy-score.ts` assigns sender 20, recipient 20, amount 20, token 15, timing resistance 10, network metadata 10, and entry/exit awareness 5. `private` earns full property points; `counterparty` earns half; `public` earns zero. STRK20 routes earn the five awareness points because they report the public boundary. Timing and network metadata currently earn zero.

A fully encrypted private transfer therefore scores 80/100. This is an explanation aid, not a measured anonymity set, proof-security score, audit result, or device-security guarantee.

## No silent downgrade

When the caller asks for a property that the selected route cannot keep private, `evaluatePrivacy` returns `UNSUPPORTED`. Public execution is returned only when the caller requested no confidentiality properties.

## Further reading

- [STRK20 documentation](https://strk20.starknet.io/docs)
- [Starknet Privacy repository](https://github.com/starkware-libs/starknet-privacy)
- [Threat model](threat-model.md)
- [Limitations](limitations.md)

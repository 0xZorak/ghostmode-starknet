# Privacy model

GhostMode distinguishes cryptographic confidentiality from UI masking and server secrecy.

| Category | Surface | Explanation |
|---|---|---|
| Private | In-pool sender | A spend publishes a nullifier, not the owner's public account |
| Private | Encrypted-note recipient | Recipient is encrypted in a normal private transfer note |
| Private | Encrypted-note token and amount | These fields are encrypted in a normal private transfer |
| Private | Spent-note linkage | Zero-knowledge proof validates the spend without publishing note links |
| Partially observable | Receipt-gated purchase | Gate, request ID, resource commitment, signature, and timing are public; payment contents are not |
| Partially observable | Private invoke | Helper and calldata are public; open-note token/amount are public |
| Public | Shield | Account, token, amount, pool, and timing are visible |
| Public | Unshield | Recipient, token, amount, pool, and timing are visible |
| Public | Transaction existence | STRK20 usage and block placement are observable |
| Out of scope | HTTP/IP/RPC metadata | STRK20 does not anonymize network transport |
| Out of scope | Compromised wallet | A malicious extension can reveal or misuse keys |

## What the receipt reveals

`ReceiptAccepted` exposes an opaque `request_id` and `resource_commitment`. The signature proves that the configured seller authority approved those values for that gate and expiry. It does not prove subjective report quality, nor does it expose the private transfer amount or recipient.

## Score methodology

The score is deterministic: sender 20, recipient 20, amount 20, token 15, timing resistance 10, network metadata 10, and entry/exit handling 5. A private property earns full points, counterparty-visible earns half rounded down, and public earns zero. STRK20 routes earn the five entry/exit-awareness points because they disclose that boundary explicitly. Timing and network metadata currently earn zero. A fully encrypted private transfer therefore scores 80/100—not 100.

The score describes the selected route, not the trustworthiness of the user's device or anonymity against a global traffic observer.

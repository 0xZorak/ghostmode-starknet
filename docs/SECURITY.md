# Security review

## Fixed controls

- **Public fallback:** policy engine refuses unmet private requirements.
- **Forged invoice:** ReceiptGate verifies a seller-authority Stark signature.
- **Cross-contract/request substitution:** gate address, request ID, commitment, and expiry are signed.
- **Replay:** onchain consumed map plus server-side one-way claim state.
- **Expiration:** checked by parser and Cairo block timestamp.
- **Unauthorized contract caller:** only the pinned STRK20 pool can invoke.
- **Transaction substitution:** resource release checks exact gate, request, commitment, successful receipt, seller, token, amount, and accepted block.
- **Ambiguous notes:** more than one matching seller note fails closed.
- **Key exposure:** browser logs no account/private material; seller secrets stay in isolated service env.
- **Mainnet:** read-only commands are separate and deployment requires an explicit environment flag.

## Remaining risks

The in-memory quote store cannot coordinate multiple server replicas and loses state on restart. Use durable storage with a unique request ID, transaction, and compare-and-set transition before production.

Seller note matching is the safest supported architecture presently exposed by the SDK, but it is not a proof that an encrypted note itself carries the request ID. Same-amount same-block collisions are rejected.

The seller verifier's SDK `Account` has spending authority. Run it with a purpose-built low-value account, least-privilege infrastructure, restricted egress, encrypted secrets, and monitoring. A future official viewing-only API should replace it.

RPCs can omit or delay events. GhostMode fails closed and asks the user not to resubmit while status is uncertain. It cannot defend a compromised wallet, browser, host, dependency supply chain, or global traffic observer.

## Logging policy

Never log private/viewing/spending keys, seed phrases, decrypted notes, hidden amounts, full seller/buyer linkage, raw provider errors, or authorization bearer tokens. Operational logs should contain a request ID, coarse status, network, and sanitized error code only.

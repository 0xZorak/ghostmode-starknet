# Threat model

## Protected property

GhostMode aims to reduce public linkage between an agent or owner and an in-pool payment's recipient, token, amount, and prior private notes. It also prevents the application from calling a weaker route “private.”

## Adversaries

### Public blockchain observer

Sees registration, deposits, withdrawals, transaction timing, nullifiers, helper address, signed opaque request, and receipt event. It should not learn normal encrypted-note contents. Timing, distinctive amounts at entry/exit, and small anonymity sets can still create correlations.

### Malicious seller

Can issue misleading resources, observe the HTTP request and delivery time, and learn its received token/amount after decryption. It cannot make the gate accept an altered request without its authority signature, but GhostMode does not prove subjective report quality. Resource commitments prove byte identity only.

### Malicious buyer or AI agent

May replay, substitute, expire, or forge an invoice; submit another transaction; or race claims. Cairo domain-separated authorization, expiry, onchain consumption, exact receipt matching, and server claim state address these cases. A buyer can refuse payment but receives no resource.

### Malicious website

May request wallet access, fingerprint the wallet, present deceptive text, or try to submit on the wrong chain. GhostMode validates structured requests, network, addresses, amount, expiry, and wallet capability; the wallet confirmation remains a critical boundary.

### Compromised GhostMode server

Can expose pending resources, quote metadata, or quote-authority key and can lie about policy responses. It cannot decrypt buyer notes without wallet keys. A compromised quote key can authorize fake requests but cannot spend seller funds. Rotate it and deploy/update the gate authority through a reviewed migration.

### Compromised seller verifier

Can expose viewing information and may hold a seller account signer because the current SDK requires an Account. Isolate it, use a dedicated low-value account, restrict network access, encrypt secrets, and monitor. This is the highest-impact remaining service risk.

### Compromised RPC, prover, or discovery service

Can censor, delay, omit, or correlate requests. GhostMode fails closed on uncertainty. Use trusted TLS endpoints, pinned configuration, redundant read RPCs, and OHTTP where officially supported. It cannot guarantee availability.

### Traffic analyst

Can correlate website IP, RPC calls, wallet prompts, block timing, deposits, and withdrawals. STRK20 does not provide network-layer anonymity. Use operational separation, non-distinctive timing, and approved privacy transport where available.

## Explicitly not protected

- Compromised wallet, seed phrase, browser, or host
- HTTP contents, prompts, IP addresses, cookies, and RPC metadata
- Public helper target/calldata/state in a private invoke
- Shield/unshield identity, token, amount, and timing
- Seller knowledge of its own received payment
- Resource truth, legality, or semantic quality
- Denial of service and global timing correlation

## Failure policy

Unmet privacy, missing capability, invalid signature, expiry, replay, ambiguous note, unavailable verifier, or uncertain transaction all fail closed. No public payment fallback and no resource release occurs.

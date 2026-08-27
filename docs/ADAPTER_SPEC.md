# GhostMode privacy adapter specification

## One-line product

Add an STRK20 private execution path to any compatible Starknet application.

“Compatible” is essential. GhostMode protects asset ownership and payment relationships through STRK20; it does not turn public Starknet computation into arbitrary confidential compute.

## Decision table

| Action shape | Route | Result |
| --- | --- | --- |
| Encrypted token transfer, no external call | `strk20-private-transfer` | Ready |
| AVNU swap | `avnu-private-swap` | Ready; use the supported first-party route |
| One DeFi or gate call with valid token flow | `strk20-private-invoke` | Adapter required |
| More than one external invoke | Unsupported | Split or redesign the action |
| Target calldata must be secret | Unsupported | The called contract sees public calldata |
| Target contract storage must be secret | Unsupported | Starknet storage and events remain public |

## Manifest

`ghostmode-compatibility.json` uses schema `ghostmode-compatibility/0.1`. It records:

- the declared action and privacy requirements;
- the selected route and one-invoke budget;
- the atomic action plan;
- surfaces that are hidden, visible or blocked;
- wallet, registration, maturity and simulation requirements;
- whether a Cairo helper needs review.
- the selected registry adapter, its readiness status and source.

The x402 proof-of-concept separately exports `ghostmode-adapter.json`. That manifest contains concrete quote, network, seller, gate and ReceiptGate data for the working flagship route.

## Security boundary

A generated manifest is not an audit. GhostMode currently does not generate or deploy arbitrary Cairo. A helper used with `privacy_invoke` must:

- pin and authenticate the expected STRK20 pool;
- expose the required `privacy_invoke` entry point;
- use no more than the transaction's single external invoke;
- approve the pool for returned assets instead of transferring them directly;
- return the exact runtime balance delta as `Span<OpenNoteDeposit>`;
- clearly disclose that open-note token and amount are public.

Stateful helpers must also bind privileged state transitions to the pool caller and protect replay-sensitive intent data.

The included ReceiptGate additionally pins a seller quote-authority public key. Its
constructor is `(STRK20_POOL_ADDRESS, SELLER_AUTHORITY_PUBLIC_KEY)`, and every
request carries a contract-domain-separated Stark signature over request ID,
resource commitment, and expiry.

## Why this belongs on Starknet

The adapter is not a generic privacy wrapper that could be replaced with an ordinary API gateway. Its decisions and execution model depend on STRK20 notes, wallet-held viewing keys, proof-backed private actions, atomic `privacy_invoke`, open-note deposits and Starknet helper contracts. Removing STRK20 removes the core product rather than a payment option.

# Threat model

## Assets

- Buyer and seller spending/viewing keys
- Private balances and note contents
- Payer-to-seller relationship inside the pool
- Payment token, amount, and spent-note linkage
- Agent strategy, supplier graph, service usage, and operational schedule
- Protected resource bytes and quote state
- Receipt authorization and replay state

## Adversaries

### Public blockchain observer

Sees registration, deposits, withdrawals, pool use, timing, nullifiers, gate address, opaque request/commitment, calldata, and public events. It should not learn normal encrypted-note contents directly. Timing, distinctive amounts, entry/exit behavior, and small anonymity sets remain correlation risks.

### Competitor or commercial analyst

May combine chain data with websites, vendor identities, known wallets, API timing, and business intelligence. GhostMode reduces a supported in-pool payment edge but does not prevent offchain inference.

### Malicious seller

Sees the HTTP request and its own received token/amount, can deliver a misleading resource, or withhold service. A recipient can recompute the commitment to compare delivered bytes, but that does not prove truth, legality, or quality; the current UI does not yet perform this recomputation.

### Malicious buyer or agent

May alter, replay, expire, substitute, or race a quote. Typed validation, domain-separated authorization, expiry, onchain consumption, exact receipt matching, and server claim state address these cases. A buyer can refuse payment but should receive no protected resource.

### Compromised frontend

Can present deceptive text, fingerprint wallets, request permissions, or build hostile actions. Structured validation and wallet confirmation reduce but do not remove this risk. Users must inspect wallet prompts.

### Compromised root server

Can expose pending resources and quote metadata, lie about policy output, and misuse the quote key. It cannot decrypt buyer notes without wallet material. A quote-key compromise requires key rotation and a new/migrated gate authority.

### Compromised seller verifier

Can expose seller viewing history and may spend from the configured account. It is the highest-impact service boundary; use a dedicated low-value account and strict isolation.

### Malicious or unavailable RPC, prover, or discovery service

Can censor, delay, omit, correlate, or return inconsistent data. GhostMode fails closed on uncertainty but cannot guarantee availability. TLS alone does not hide client metadata from the endpoint.

### Network observer

Can correlate website, RPC, proving/discovery, wallet prompt, and block timing. STRK20 is not a network anonymity layer.

## Trust assumptions

- Wallet implementation protects keys and implements the reported API correctly.
- STRK20 pool, proving/discovery stack, cryptography, and deployed addresses match the intended network.
- ReceiptGate source matches the deployed class and constructor configuration.
- Seller quote authority signs honest commercial terms.
- Seller verifier's note discovery and credentials are not compromised.
- Root server and storage enforce release policy correctly.

## Protected information

For a normal encrypted transfer, GhostMode relies on STRK20 to protect the in-pool payer/recipient relationship, token, amount, and spent-note linkage from public observers. It also protects against silent policy downgrade by refusing unmet requirements.

## Observable information

Shield/unshield edges, registration, timing, pool usage, nullifiers, ReceiptGate call, quote ID, commitment, expiry, signature, target calldata/state/events, and open-note outputs where used.

## Out of scope

- Compromised wallet, seed phrase, browser, host, or dependency chain
- HTTP contents, IP addresses, cookies, RPC metadata, and global traffic analysis
- Public helper calldata/storage/events
- Seller knowledge of its own payment
- Resource truth or quality
- Legal compliance decisions outside the underlying protocol
- Denial of service

## Correlation and entry/exit leakage

Distinctive public deposits/withdrawals, short delays, repeated exact amounts, fresh channels, small anonymity sets, and public resource timing can link activity probabilistically. Shield separately, avoid distinctive operational patterns where lawful, and do not claim GhostMode eliminates correlation.

## Metadata leakage

The workbench and seller API reveal request timing and endpoint use. RPC/prover/discovery services can observe client timing and potentially account/context depending on the request. OHTTP can improve transport privacy where properly enabled and pinned, but this integration does not enable it.

## Key compromise

- Buyer spending key: funds and privacy lost.
- Buyer viewing key: confidentiality lost; spending remains protected by the spending key.
- Seller viewing key: seller payment history exposed.
- Seller account key: seller funds/actions at risk.
- Quote key: fraudulent quotes possible; funds cannot be spent directly.
- Verifier token: unauthorized note-match queries possible.

## Failure policy

Invalid intent, missing capability, unsupported privacy, bad signature, expiry, replay, ambiguous note, unavailable verifier, wrong network, and uncertain confirmation fail closed. No automatic public fallback or resource release occurs. A fail-closed result does not always mean funds did not move; consult [troubleshooting](troubleshooting.md).

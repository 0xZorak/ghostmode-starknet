# Limitations

### No current complete live deployment

**Why it exists:** the signed ReceiptGate and seller verifier require owner-controlled deployment and credentials.<br>
**Impact:** local tests prove code paths, not a complete live Sepolia purchase.<br>
**Workaround:** follow the Sepolia guide and record real evidence.<br>
**Future direction:** publish verified addresses and automated deployment evidence.

### No audit

**Why it exists:** hackathon prototype stage.<br>
**Impact:** contract and application code should not custody meaningful value.<br>
**Workaround:** use testnet/low-value isolated accounts.<br>
**Future direction:** independent Cairo/application review and remediation.

### Public entry and exit edges

**Why it exists:** STRK20 deposits and withdrawals cross between public balances and private notes.<br>
**Impact:** depositor/recipient, token, amount, and timing are visible and may correlate with private use.<br>
**Workaround:** shield separately and avoid distinctive timing/amount patterns where appropriate.<br>
**Future direction:** improved batching and operational privacy UX; the protocol boundary remains explicit.

### No arbitrary private smart contracts

**Why it exists:** `privacy_invoke` protects private note ownership, not general Starknet calldata, storage, or events.<br>
**Impact:** GhostMode cannot “make every contract private.”<br>
**Workaround:** use reviewed one-invoke helpers and disclose visible surfaces.<br>
**Future direction:** add protocol-specific adapters and upstream private routes.

### One external invoke budget

**Why it exists:** selected STRK20 transaction model permits at most one external invoke/compute-and-invoke action.<br>
**Impact:** multi-contract workflows may be unsupported.<br>
**Workaround:** redesign behind one reviewed helper or split the flow with explicit privacy consequences.<br>
**Future direction:** follow protocol evolution without assuming a higher budget.

### Ephemeral quote and verification state

**Why it exists:** the demo uses a process-global `Map`.<br>
**Impact:** restart loses quotes; replicas do not coordinate; recovery is incomplete.<br>
**Workaround:** single-process local demo only.<br>
**Future direction:** transactional Redis/Postgres adapter with unique IDs and compare-and-set release.

### Same-block note matching

**Why it exists:** the verifier cannot bind the encrypted note to the quote ID directly.<br>
**Impact:** equal-token/equal-amount seller notes in one block are ambiguous and resource release fails closed.<br>
**Workaround:** avoid colliding demo payments and resolve ambiguity manually.<br>
**Future direction:** protocol-supported private payment tag or stronger proof linkage.

### Seller verifier holds a spending key

**Why it exists:** current SDK wiring constructs an `Account`.<br>
**Impact:** verifier compromise can affect seller confidentiality and funds.<br>
**Workaround:** dedicated low-value account, strict isolation, restricted ingress/egress, and secret management.<br>
**Future direction:** adopt an official viewing-only integration when available.

### Seller service is Sepolia-only

**Why it exists:** `privacy.mjs` pins `SN_SEPOLIA` and server validation accepts only `sepolia`.<br>
**Impact:** configuring Mainnet app values does not create a Mainnet-capable verifier.<br>
**Workaround:** do not enable Mainnet release flow.<br>
**Future direction:** explicit per-network service configuration and deployment review.

### Manual wallet E2E

**Why it exists:** wallet consent, proving, relaying, and public services are interactive/external.<br>
**Impact:** `npm run test:e2e` is a mocked-wallet integration suite, not live E2E.<br>
**Workaround:** execute and record the manual Sepolia runbook.<br>
**Future direction:** supported isolated wallet harness and public-network smoke tests.

### Wallet and service compatibility moves quickly

**Why it exists:** Wallet API, SDK, prover, indexer, and contract deployments evolve independently.<br>
**Impact:** a previously working brand/version can stop matching.<br>
**Workaround:** runtime version detection, exact pins, freshness checks, and manual tests.<br>
**Future direction:** compatibility CI against supported wallet/service releases.

### Transport metadata remains visible

**Why it exists:** STRK20 protects note data, not HTTP/IP/RPC traffic.<br>
**Impact:** observers or services may correlate requests and timing.<br>
**Workaround:** privacy-aware infrastructure, minimized logs, TLS, and OHTTP with pinned keys where supported.<br>
**Future direction:** integrate and verify transport privacy without claiming it is automatic.

### Resource commitment is not yet checked by the client

**Why it exists:** the demo hashes serialized resource bytes, but the current client does not recompute the field-sized commitment after delivery.<br>
**Impact:** the response carries commitment evidence without automatically detecting byte substitution; even a successful comparison would not prove content quality.<br>
**Workaround:** consumers can implement the same documented hash procedure and still need marketplace reputation, dispute, schema, and content validation.<br>
**Future direction:** add client-side commitment verification plus application-specific attestations and dispute mechanisms.

### Draft HTTP 402 schema

**Why it exists:** `ghostmode-http402/0.2` is project-specific and uses HTTP 402 semantics without claiming formal x402 interoperability.<br>
**Impact:** other x402 clients/servers are not automatically compatible.<br>
**Workaround:** use the documented quote parser and adapter.<br>
**Future direction:** align with a stable interoperability specification after review.

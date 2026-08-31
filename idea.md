# Hackathon Idea Library

This file is our permanent idea bank for hackathons. It records products worth studying, the design pattern each one proves, and the lesson we can reuse without copying the product.

## How projects enter this file

For the STRK20 Private Sprint snapshot on 2026-08-31:

- **Evidence-backed product:** live demo, mainnet status, and at least three verified STRK20 pool transactions.
- **Standout benchmark:** evidence-backed plus an unusually strong problem, technical route, product presentation, or reusable integration pattern.
- **Concept watchlist:** original idea worth remembering, but without enough live mainnet evidence to call it a working benchmark.

These are research labels, not official placements or judging results. The live catalogue is [STRK20 Private Sprint](https://strk20.starknet.io/hackathon), backed by its public [projects dataset](https://raw.githubusercontent.com/starkience/strk20-hackathon/refs/heads/main/projects.json).

## Standout benchmarks

### 1. Facet — unlinkable identity per application

- **One line:** One shielded balance funds a different unlinkable identity for every Starknet application.
- **Why it stands out:** It uses privacy for identity separation, not merely token transfer. Shadow accounts make STRK20 essential to the product.
- **Pattern to remember:** A shared private treasury can create separate public execution identities for different contexts.
- **Risk:** Shadow-account UX and protocol-specific helpers increase integration and audit complexity.
- [Repository](https://github.com/Jennycruzy/facet) · [Demo](https://usefacet.xyz)

### 2. Airlock — unlinkable cross-chain movement

- **One line:** Move value between chains without publishing a direct onchain link between the two sides.
- **Why it stands out:** Cross-chain privacy addresses a real graph-analysis weakness at bridge edges.
- **Pattern to remember:** Separate entry and exit identities, timing, and message handling rather than wrapping a normal bridge in a private-looking interface.
- **Risk:** Bridge trust, relayer metadata, timing correlation, and compliance boundaries remain difficult.
- [Repository](https://github.com/kenkomu/airlock) · [Demo](https://kenkomu.github.io/airlock/)

### 3. Aperture — private governance plus shielded treasury

- **One line:** A DAO can vote with sealed ballots and move treasury funds without exposing every participant's financial graph.
- **Why it stands out:** It combines two privacy surfaces—governance and treasury—into one understandable institutional use case.
- **Pattern to remember:** Privacy becomes more valuable when it protects both a decision and the financial action produced by that decision.
- **Risk:** Eligibility, anti-double-voting, result disclosure, and governance auditability must remain explainable.
- [Repository](https://github.com/OoJae/aperture-strk20) · [Demo](https://aperture-strk20.vercel.app)

### 4. Erebus — private negotiation for AI agents

- **One line:** AI agents negotiate privately and settle through STRK20 without publishing their commercial strategy.
- **Why it stands out:** It moves beyond “agents can pay” to the more valuable problem of hiding offers, counterparties, and settlement relationships.
- **Pattern to remember:** Private machine commerce needs negotiation confidentiality, payment privacy, replay protection, and delivery verification together.
- **Risk:** If negotiation happens on an ordinary server, network metadata and operator visibility can undermine the privacy story.
- [Repository](https://github.com/PoulavBhowmick03/Erebus) · [Demo](https://erebus-private-agents.vercel.app)

### 5. Tony-Strk — anonymous browsing and private agent payments

- **One line:** An AI agent can access paid web resources through Tor and settle the request privately with STRK20.
- **Why it stands out:** It joins network privacy, agent tooling, x402-style payments, a Cairo anonymizer, and real mainnet execution.
- **Pattern to remember:** A payment receipt can be produced by an anonymizer that pays a public merchant while concealing the pool user.
- **Risk:** Merchant, resource commitment, token, and price may still be public depending on the receipt route.
- [Repository](https://github.com/Aaronvern/Tony-Strk) · [Demo](https://tony-strk.vercel.app)

### 6. Envelope — private payments without recipient wallet setup

- **One line:** Send value as a sealed link that the recipient can claim without already having a configured privacy wallet.
- **Why it stands out:** It attacks the hardest consumer privacy problem: recipient onboarding.
- **Pattern to remember:** Claim links and escrow can bridge the gap created by STRK20's requirement that a private-transfer recipient be registered.
- **Risk:** Link theft, secret delivery, expiry, refund paths, and phishing must be handled rigorously.
- [Repository](https://github.com/0xrlawrence/envelope) · [Demo](https://0xrlawrence.github.io/envelope/)

### 7. MorokPay — reusable private donation identity

- **One line:** A creator publishes one QR code while supporters choose amounts and pay inside the privacy pool.
- **Why it stands out:** Clear consumer use case, mainnet evidence, Ready wallet support, and a route for MetaMask-only users.
- **Pattern to remember:** Reusable payment endpoints need recipient registration checks, live pool-fee reads, maturity handling, and careful channel-opening privacy.
- **Risk:** The first setup interaction can name the recipient or shrink the anonymity set if it is tightly coupled to payment.
- [Repository](https://github.com/ssadkov/morok-pay-starknet) · [Demo](https://morok-pay-starknet.vercel.app)

### 8. Aegis Rescue — privacy as incident response

- **One line:** Rescue funds from an exposed wallet into a private safe destination before an attacker drains them.
- **Why it stands out:** It reframes a privacy pool as security infrastructure rather than a payment product.
- **Pattern to remember:** Privacy can break an attacker's ability to follow rescued assets from a compromised public identity.
- **Risk:** Transaction ordering, attacker bots, key compromise, proof latency, and authorization safety are existential.
- [Repository](https://github.com/justbiar/aegis) · [Demo](https://aegis-peach-six.vercel.app)

### 9. Offbook — private bilateral OTC settlement

- **One line:** Two parties agree fixed trade terms and settle without publishing the trader relationship.
- **Why it stands out:** OTC trading has an obvious confidentiality need and visible commercial value.
- **Pattern to remember:** A strong privacy app protects negotiation, counterparty identity, and atomic settlement—not just the final transfer.
- **Risk:** Asset delivery, price commitments, expiry, disputes, and helper-contract custody require careful design.
- [Repository](https://github.com/Akinbola247/offbook) · [Demo](https://offbooks.vercel.app/)

### 10. ConditionalPay — programmable private settlement

- **One line:** Lock private value behind claim, refund, and condition rules.
- **Why it stands out:** It turns private transfers into programmable business workflows.
- **Pattern to remember:** Stateful anonymizer contracts can implement escrow when direct private transfer is impossible or premature.
- **Risk:** Stateful helpers hold funds across transactions and therefore need pinned pool callers, replay protection, and audit-quality recovery logic.
- [Repository](https://github.com/eugenennamdi/ConditionalPay) · [Demo](https://conditionalpay.vercel.app)

### 11. Stealth Checkout — drop-in private merchant acceptance

- **One line:** Add private checkout to a site with a hosted invoice and small integration surface.
- **Why it stands out:** Excellent distribution strategy and extremely easy product explanation.
- **Pattern to remember:** The fastest merchant route can unshield to a fresh invoice address and verify the public balance delta.
- **Risk:** This hides payer linkage but exposes destination and amount, so it offers less privacy depth than an encrypted seller note.
- [Repository](https://github.com/bongbongcrypto/stealth-checkout) · [Demo](https://bongbongcrypto.github.io/stealth-checkout/apps/demo-arcade/index.html)

### 12. Lacuna — developer workbench for private flows

- **One line:** Build, inspect, and verify STRK20 Wallet API flows from one developer tool.
- **Why it stands out:** Infrastructure can multiply the value of every downstream privacy application.
- **Pattern to remember:** Debugging tools should expose action construction, wallet capability, pool evidence, simulation, and privacy boundaries.
- **Risk:** A generic workbench is easy to imitate unless it owns a uniquely useful compiler, verifier, or deployment workflow.
- [Repository](https://github.com/dexarxbt/Lacuna) · [Demo](https://lacuna-strk.vercel.app/)

### 13. Limen — proof of capital without balance disclosure

- **One line:** Confirm that someone has enough capital without revealing their complete wallet balance.
- **Why it stands out:** It converts privacy into a reusable credential rather than a hidden payment.
- **Pattern to remember:** Selective financial disclosure can unlock lending, marketplaces, access control, and institutional workflows.
- **Risk:** The proof statement, freshness, replay prevention, and exact information leakage must be specified precisely.
- [Repository](https://github.com/winsznx/limen) · [Demo](https://limen.timjosh507.workers.dev)

### 14. Cutout — privacy-aware wallet signing guard

- **One line:** Warn users when a shield action creates a weak anonymity set before they sign it.
- **Why it stands out:** It improves privacy quality instead of merely enabling a privacy transaction.
- **Pattern to remember:** A privacy product can analyze public pool evidence and recommend safer amounts or timing.
- **Risk:** Heuristics must be presented as risk estimates, never as guarantees of anonymity.
- [Repository](https://github.com/dmetagame/cutout) · [Demo](https://cutout.rouma.online/)

### 15. Philoxenia — privacy for real-world hospitality

- **One line:** Discover and pay for peer-to-peer stays without exposing the guest-host financial relationship publicly.
- **Why it stands out:** It applies privacy to a surprising, human, real-world marketplace.
- **Pattern to remember:** The most memorable hackathon products combine a private financial edge with a socially visible application.
- **Risk:** Trust, identity, reputation, disputes, location privacy, and physical safety cannot be solved by payment privacy alone.
- [Repository](https://github.com/SergioSSantiago/philoxenia) · [Demo](https://philoxenia-iota.vercel.app)

## All evidence-backed STRK20 products

The following 43 projects had a live demo, mainnet status, and at least three verified pool transactions in the 2026-08-31 catalogue snapshot.

### Payments

| Product | Core idea | Pattern worth saving | Links |
|---|---|---|---|
| KudiRoll | Private payroll for Nigerian businesses | Batch operational payments with reusable teams and shielded USDC | [Code](https://github.com/Cyano88/kudiroll) · [Demo](https://kudiroll-production.up.railway.app) |
| MorokPay | Private creator donations through one reusable QR | Recipient onboarding, dynamic amounts, fee and maturity handling | [Code](https://github.com/ssadkov/morok-pay-starknet) · [Demo](https://morok-pay-starknet.vercel.app) |
| Sage | AI agent recruits and privately pays product testers | Private agent labor marketplace with task delivery | [Code](https://github.com/shariqazeem/sage) · [Demo](https://sagepays.xyz) |
| NIGHTSHIFT | Automated private subscriptions | Recurring private payments and scheduling | [Code](https://github.com/kshitij-hash/nightshift) · [Demo](https://nightshift-six-lilac.vercel.app) |
| WhisperPay | Turn a photographed receipt into private split-bill links | Computer vision plus payment-link distribution | [Code](https://github.com/bugsm/whisperpay) · [Demo](https://whisperpay.vercel.app) |
| Envelope | Sealed payment links without wallet prerequisites | Escrow/claim link solves unregistered-recipient onboarding | [Code](https://github.com/0xrlawrence/envelope) · [Demo](https://0xrlawrence.github.io/envelope/) |
| ShadowPay | Anonymous payroll for teams | Private recurring business payouts | [Code](https://github.com/A-Raphie/shadowpay) · [Demo](https://shadowpay-green.vercel.app) |

### Infrastructure

| Product | Core idea | Pattern worth saving | Links |
|---|---|---|---|
| Facet | Unlinkable identity per app from one shielded balance | Shadow-account application launcher | [Code](https://github.com/Jennycruzy/facet) · [Demo](https://usefacet.xyz) |
| Airlock | Cross-chain transfers without a direct onchain link | Decoupled entry and exit identities | [Code](https://github.com/kenkomu/airlock) · [Demo](https://kenkomu.github.io/airlock/) |
| Almoner | Private batch payments to many recipients | Claim/escrow fallback for recipient registration | [Code](https://github.com/leojay-net/almoner) · [Demo](https://strkprivacy.vercel.app) |
| Jalin | Arbitrary multi-step, multi-token execution in one transaction | Transaction-plan compiler within protocol limits | [Code](https://github.com/PugarHuda/jalin) · [Demo](https://jalin-five.vercel.app) |
| Limen | Prove capital availability without revealing a balance | Selective financial credential | [Code](https://github.com/winsznx/limen) · [Demo](https://limen.timjosh507.workers.dev) |
| Xence | Seal forecasts and score them later | Commit/reveal for private information markets | [Code](https://github.com/AustinChris1/xence) · [Demo](https://xence.vercel.app) |
| ConditionalPay | Private settlement with claims and refunds | Stateful privacy escrow | [Code](https://github.com/eugenennamdi/ConditionalPay) · [Demo](https://conditionalpay.vercel.app) |
| Cordon | Credential and policy layer for private payments | Compliance/policy gate attached to execution | [Code](https://github.com/RaYYeR220/cordon) · [Demo](https://rayyer220.github.io/cordon/) |
| Quorum | Campaign activates only after private commitments reach a threshold | Private coordination with a public outcome | [Code](https://github.com/iamdflame/quorum) · [Demo](https://quorum-strk20.vercel.app) |
| Aperture | Sealed DAO ballots and shielded treasury | Privacy across decision and execution | [Code](https://github.com/OoJae/aperture-strk20) · [Demo](https://aperture-strk20.vercel.app) |
| Cutout | Signing guard based on STRK20 anonymity evidence | Privacy-risk analysis before execution | [Code](https://github.com/dmetagame/cutout) · [Demo](https://cutout.rouma.online/) |

### DeFi

| Product | Core idea | Pattern worth saving | Links |
|---|---|---|---|
| Doom | Prediction market with public odds and hidden bettors | Public market state plus private participant positions | [Code](https://github.com/neromtoobad/doom) · [Demo](https://neromtoobad.github.io/doom/) |
| CipherBid | Vickrey auctions with private bids | Sealed bids and verifiable settlement | [Code](https://github.com/SourceSenseiTheRealOne/cipherbid) · [Demo](https://sourcesenseitherealone.github.io/cipherbid/auction/?id=1788040057342) |
| Offbook | Private bilateral OTC trades | Confidential negotiation plus atomic settlement | [Code](https://github.com/Akinbola247/offbook) · [Demo](https://offbooks.vercel.app/) |

### Consumer products

| Product | Core idea | Pattern worth saving | Links |
|---|---|---|---|
| strk20.run | Private account for value, swaps, chat, bets, launches, and voting | Consumer privacy superapp | [Code](https://github.com/Blockchain-Oracle/strk20-run) · [Demo](https://strk20.run) |
| Afterlight | Private recovery reserve for self-custody wallets | Privacy as disaster recovery | [Code](https://github.com/qdeeworld/afterlight) · [Demo](https://afterlight.dolepee.com) |
| Wrenchless | Flexible private STRK/USDC vault | Private savings and delayed return | [Code](https://github.com/Timidan/wrenchless) · [Demo](https://wrenchless.timidan.xyz) |
| Lumen | Private Bitcoin account on Starknet | Shielded BTC-oriented saving and staking | [Code](https://github.com/shariqazeem/lumen-strk20) · [Demo](https://lumen-strk20.vercel.app) |
| Mirage | Shielding and cross-chain privacy superapp | Unified privacy UX across assets and chains | [Code](https://github.com/YanYuanFE/mirage) · [Demo](https://mirage-beta-app.vercel.app) |
| Deadletter | Protected evidence exchange with encrypted reporting | Anonymous disclosure plus private incentive | [Code](https://github.com/ELLA0VICTOR/deadletter) · [Demo](https://deadletter.vercel.app/) |
| Lantern | Crowdfunding with public goals and anonymous donors | Public coordination, private participation | [Code](https://github.com/PhiBao/lantern) · [Demo](https://app-wine-seven-35.vercel.app) |
| Booty Bank | Financial tools for creators with private income handling | Vertical banking where confidentiality is commercially necessary | [Code](https://github.com/odinfree/booty-bank) · [Demo](https://bootybank.app/) |

### Developer tooling

| Product | Core idea | Pattern worth saving | Links |
|---|---|---|---|
| Aegis Rescue | Sweep exposed funds into privacy before an attacker wins | Security incident response using privacy rails | [Code](https://github.com/justbiar/aegis) · [Demo](https://aegis-peach-six.vercel.app) |
| Lacuna | STRK20 Wallet API workbench | Developer debugging, inspection, and verification | [Code](https://github.com/dexarxbt/Lacuna) · [Demo](https://lacuna-strk.vercel.app/) |
| Stealth Checkout | Drop-in hosted private checkout | Tiny merchant integration surface | [Code](https://github.com/bongbongcrypto/stealth-checkout) · [Demo](https://bongbongcrypto.github.io/stealth-checkout/apps/demo-arcade/index.html) |

### Other strong applications

| Product | Core idea | Pattern worth saving | Links |
|---|---|---|---|
| Stake Wars | Validator delegation becomes a territory strategy game | Hide economic strategy inside a visible game | [Code](https://github.com/broody/stake-wars) · [Demo](https://stakewars.gg) |
| Gigstark | Private payments to creators | Simple vertical payment UX | [Code](https://github.com/OGtev317/Gigstark) · [Demo](https://zeerostream.pages.dev) |
| Philoxenia | Private peer-to-peer hospitality | Privacy in a real-world marketplace | [Code](https://github.com/SergioSSantiago/philoxenia) · [Demo](https://philoxenia-iota.vercel.app) |
| Erebus | Encrypted negotiation and settlement for AI agents | Private machine commerce beyond payment | [Code](https://github.com/PoulavBhowmick03/Erebus) · [Demo](https://erebus-private-agents.vercel.app) |
| Tony-Strk | Anonymous browsing and private agent payments | Tor + MCP + x402-style settlement | [Code](https://github.com/Aaronvern/Tony-Strk) · [Demo](https://tony-strk.vercel.app) |
| Cloakra | Shielded grants and bounty allocation | Private capital allocation | [Code](https://github.com/mrnetwork0001/Cloakra) · [Demo](https://cloakra-k81ir4y3k-mrnetworks-projects.vercel.app) |
| Hidden | Shielded 1v1 wagering with hidden moves | Private game state plus private stakes | [Code](https://github.com/DevTest-me/hidden-starknet) · [Demo](https://hidden-starknet.vercel.app/) |
| Provah | Transferable capabilities derived from pool activity | Private activity as access credential | [Code](https://github.com/levithefirst/provah) · [Demo](https://provah.vercel.app) |
| GhostLine | Privacy intelligence before private transactions | Explain exposure before execution | [Code](https://github.com/Leequidice/GhostLine) · [Demo](https://ghostline-weld.vercel.app) |
| Before You Sign | Simulate the privacy implications of an STRK20 action | Pre-signing privacy report | [Code](https://github.com/Valorian0108/before-you-sign) · [Demo](https://before-you-sign-seven.vercel.app/) |
| Morrow | Privacy preflight for milestone grants | Route analysis attached to funding workflows | [Code](https://github.com/nftkingiii/Morrow) · [Demo](https://morrow-production.up.railway.app) |

## Concept watchlist

These ideas are memorable, but their catalogue entries did not meet the evidence-backed threshold at the snapshot time.

| Product | Idea worth remembering | Missing proof at snapshot | Links |
|---|---|---|---|
| Vickrey | Losing auction bids never become public | No verified mainnet pool transactions | [Code](https://github.com/Vickrey-Protocol/vickrey) · [Demo](https://vickrey.0xo.in) |
| VINSS | Encrypted deal room from negotiation through escrow | No verified mainnet pool transactions | [Code](https://github.com/DXJLabs/vinss) · [Demo](https://vinss-nu.vercel.app/) |
| Veyl | Private launch/trading terminal with unlinkable execution identities | No verified mainnet pool transactions | [Code](https://github.com/codeswithroh/veyl) · [Demo](https://veyl-tau.vercel.app/) |
| zkPayslip | Private payroll plus verifiable income | No verified mainnet pool transactions | [Code](https://github.com/EndPx/zkpayslip) · [Demo](https://zkpayslip.vercel.app) |
| Lens | Selectively disclose payment relationships without showing full history | No verified mainnet pool transactions | [Code](https://github.com/Techkeyy/lens) · [Demo](https://lens-beige-five.vercel.app) |
| Sealed | Unlinkable bidders and concealed bids until reveal | No verified mainnet pool transactions | [Code](https://github.com/tinoxbt/sealed) · [Demo](https://tinoxbt.github.io/sealed/) |
| Nexora Protocol | Cross-chain privacy router rather than a single bridge | No verified mainnet pool transactions | [Code](https://github.com/Gedion08/Nexora-Protocol) · [Demo](https://nexora-protocol.vercel.app) |
| StarkWhisper | End-to-end encrypted messaging with private payment memos | No verified mainnet pool transactions | [Code](https://github.com/dino1x/starkwhisper) · [Demo](https://starkwhisper.vercel.app) |
| Redpocket | Password-based private group fund claims shared through chat | Only two verified transactions | [Code](https://github.com/kevlau1/redpacket) · [Demo](https://redpocket-virid.vercel.app/) |
| Mosby Pass | Private event admission with QR credentials and shielded payments | No verified mainnet pool transactions | [Code](https://github.com/odinfree/mosby-pass) · [Demo](https://welttowelt.github.io/mosby-pass/) |
| GhostBounty | Anonymous vulnerability reports with private rewards | No live demo or verified mainnet pool transactions | [Code](https://github.com/daraijaola/ghostbounty) |

## Reusable idea patterns

When brainstorming a new hackathon product, start with one of these patterns rather than a technology buzzword:

1. **Private edge + visible outcome:** anonymous donations with a public campaign total, sealed votes with a public result, or hidden bettors with public odds.
2. **Unlinkable identities:** one private balance funds separate identities for apps, suppliers, campaigns, or agent tasks.
3. **Private coordination:** participants commit privately and reveal only when a threshold or condition is reached.
4. **Selective proof:** prove enough balance, income, membership, or prior action without exposing complete history.
5. **Security recovery:** use privacy to break an attacker's ability to follow rescued assets or identify a safe destination.
6. **Recipient onboarding:** claim links or escrow let someone receive before they have completed privacy setup.
7. **Privacy compiler:** inspect an intended action, select a reviewed route, state residual leakage, and refuse unsupported promises.
8. **Private machine commerce:** protect negotiation, supplier selection, payments, receipts, and delivery—not payment alone.
9. **Vertical privacy:** choose a domain where public financial relationships cause obvious harm: payroll, creators, OTC trading, procurement, grants, healthcare, legal work, research, or hospitality.
10. **Developer multiplier:** make privacy integration, testing, debugging, verification, or deployment dramatically easier for every other builder.

## Standard for adding future ideas

For every future hackathon project saved here, record:

- the one-line explanation;
- the painful real-world problem;
- why the sponsor technology is indispensable;
- what is genuinely private and what remains public;
- live product, repository, contract, and transaction evidence;
- the strongest reusable design pattern;
- the reason it may win;
- the reason it may fail;
- how our next idea can be meaningfully different.

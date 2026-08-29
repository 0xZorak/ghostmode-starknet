# GhostMode documentation

Use this page as the map. The root [`README.md`](../README.md) explains the product and its ecosystem value; these guides cover operation and extension.

```text
Start here
├── Quickstart
├── Architecture
└── Demo

Build with GhostMode
├── Privacy checker
├── Agent SDK
├── API
├── Payments
├── ReceiptGate
└── Seller verification

Understand privacy
├── Privacy model
├── Threat model
├── Security
└── Limitations

Deploy
├── Configuration
├── Sepolia
└── Mainnet

Maintain
├── Testing
├── Compatibility
└── Troubleshooting
```

## Start here

- [Quickstart](quickstart.md): clone to a running analysis workbench.
- [Architecture](architecture.md): components, data flow, trust boundaries, failures, and extension points.
- [Demo](demo.md): a two-to-five-minute judge walkthrough.

## Build with GhostMode

- [Privacy checker](privacy-checker.md): evaluate a typed intent without submitting.
- [Agent SDK](agent-sdk.md): source-distributed `GhostMode` and `GhostModeClient` APIs.
- [HTTP API](api.md): every implemented endpoint and response class.
- [Payments](payments.md): the draft HTTP 402 quote and private purchase lifecycle.
- [ReceiptGate](receipt-contract.md): Cairo ABI, authorization, storage, events, and reverts.
- [Seller verification](seller-verification.md): private note discovery and release boundary.

## Understand privacy

- [Privacy model](privacy-model.md): hidden, visible, counterparty-known, and out-of-scope surfaces.
- [Threat model](threat-model.md): assets, adversaries, assumptions, and failure policy.
- [Security architecture](security.md): key custody, replay, validation, logging, and downgrade prevention.
- [Limitations](limitations.md): explicit technical and privacy constraints.

## Deploy and maintain

- [Configuration](configuration.md): every environment variable and secret boundary.
- [Sepolia](sepolia.md): build, deploy, verify, and manually exercise the testnet flow.
- [Mainnet](mainnet.md): guarded read-only checks and real-funds deployment boundary.
- [Testing](testing.md): test layers, commands, verified results, and missing live E2E coverage.
- [Compatibility](compatibility.md): tested versions and route support.
- [Troubleshooting](troubleshooting.md): symptom-first recovery and error catalogue.

Project policies: [contributing](../CONTRIBUTING.md), [security reporting](../SECURITY.md), [changelog](../CHANGELOG.md), and [license](../LICENSE).

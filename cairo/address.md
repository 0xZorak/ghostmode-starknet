# ReceiptGate deployment

Sepolia deployment account:

`0x057312187e9667687af5b7befd704a2a0bfe8fcd5d7db600341f5ecd9dc88327`

The private key is stored only in the gitignored `.secrets/sncast-accounts.json`.

## Historical Sepolia ReceiptGate — do not configure

This deployment predates the seller-authority constructor and signed `privacy_invoke`
calldata. It is retained only as historical chain evidence and is ABI-incompatible
with the current application. Deploy a fresh contract using `docs/sepolia.md`.

- Contract: `0x0464d61f09b05369b320a806ffef39a60afd4c811fead7bad289e85cf3bfcd6f`
- Class: `0x052df5bfa91063afdb14fbd1a572e18911e1292356c5a4bb1583134a62935b15`
- Pool: `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`
- Declare transaction: `0x051e9a74208a4df49333d838f1ab0faa4f36a6fc497b23098dc899329bb0ba3d`
- Deploy transaction: `0x0266326d29b7719a56eac097f5b22cdb2a44e49a14416a0b5f35c6dd4520acba`

The historical deployment was checked against its older pool-only interface at
the time. The current `npm run gate:verify` also reads the seller-authority key,
so it is expected to reject this ABI-incompatible contract.

Do not reuse the Sepolia contract on mainnet. After the testnet release gate
passes, deploy a separate instance pinned to the verified mainnet pool and set
`NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET`.

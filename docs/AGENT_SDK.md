# Agent SDK

The minimal SDK lives in `src/lib/ghostmode/sdk.ts`. It is strongly typed and has no key custody.

```ts
const ghost = new GhostMode({
  network: "sepolia",
  wallet: walletAccountV6,
  apiBaseUrl: "https://ghostmode.example",
});

const evaluation = ghost.evaluate(intent);
if (!evaluation.supported) throw new Error(evaluation.reason);

const payment = await ghost.pay(request);
const verified = await ghost.verify(request.requestId, payment.transaction_hash);
const status = await ghost.getPaymentStatus(request.requestId);
```

`evaluate()` is synchronous and never submits. `pay()` validates the V1 request, checks the SDK network, builds exactly one encrypted transfer plus one receipt invoke, asks the wallet to simulate, then submits. If simulation fails, submission is not attempted. `verify()` and `getPaymentStatus()` call the configured GhostMode API.

## Errors

- `INVALID_PAYMENT_REQUEST`: malformed, expired, zero, or overlong request
- `WRONG_NETWORK`: SDK/request network mismatch
- `WALLET_NOT_PRIVACY_CAPABLE`: no WalletAccountV6 attached
- wallet-native rejection/proving/discovery errors: propagated without private state logging

The SDK is source-distributed for the hackathon. The package name `@ghostmode/sdk` is reserved documentation, not a claim that an npm package has been published.

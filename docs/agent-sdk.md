# Agent SDK

The source-distributed SDK lives in `src/lib/ghostmode/sdk.ts`. It is not currently published as an npm package. Import it from source or package the module within your own repository.

## `GhostMode`

```ts
import { GhostMode } from "./src/lib/ghostmode";

const ghost = new GhostMode({
  network: "sepolia",
  wallet: walletAccountV6,
  apiBaseUrl: "https://ghostmode.example",
});
```

### Options

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `network` | `"sepolia" | "mainnet"` | Yes | Locks SDK requests to one chain. |
| `wallet` | `WalletAccountV6` | For `pay` | Privacy-capable wallet; GhostMode does not hold its keys. |
| `apiBaseUrl` | `string` | No | Prefix for status and verification calls. Empty means same origin. |
| `fetcher` | `typeof fetch` | No | Injectable transport for tests or agent runtimes. |

### `evaluate(intent)`

Synchronous and non-submitting. Returns a `PrivacyEvaluation`. If the intent network does not match the SDK network, it returns an unsupported evaluation with a `WRONG_NETWORK` reason.

### `pay(request)`

Validates the V1 request, checks chain ID and wallet presence, builds the exact transfer/invoke pair, simulates with `strk20PrepareInvoke(actions, true)`, then submits with `strk20InvokeTransaction(actions)`. If validation or simulation fails, GhostMode does not call submission.

```ts
const evaluation = ghost.evaluate(intent);
if (!evaluation.supported) throw new Error(evaluation.reason);

const result = await ghost.pay(paymentRequest);
console.log(result.transaction_hash);
```

### `verify(requestId, transactionHash)`

Calls `POST /api/payment/verify` and returns the server JSON. Verification can fail after funds have moved; handle the error according to [payments](payments.md) rather than blindly paying again.

### `getPaymentStatus(requestId)`

Calls `GET /api/payment/:id`. The response is public fulfillment state and excludes the resource, private note contents, and keys.

## `GhostModeClient`

`GhostModeClient` is the lower-level wallet action surface:

| Method | Submits? | Purpose |
|---|---:|---|
| `analyze(input)` | No | Compatibility report for an action shape. |
| `purchaseActions(quote)` | No | Build the two purchase actions. |
| `transferActions(token, amount, recipient)` | No | Build one encrypted transfer. |
| `shield(token, amount)` | Yes | Ask the wallet to deposit; wallet may require approval and deposit prompts. |
| `balances(tokens?)` | No chain transaction | Ask wallet consent to discover/decrypt balances. |
| `simulate(actions)` | No submission | Build/prove/simulate through wallet. |
| `submit(actions)` | Yes | Submit an already-reviewed action set. |
| `executePurchase(quote)` | Yes | Simulate then submit. |

```ts
import { createGhostModeClient } from "./src/lib/ghostmode";

const client = createGhostModeClient(walletAccountV6);
const actions = client.purchaseActions(quote);
await client.simulate(actions);
const { transaction_hash } = await client.submit(actions);
```

## Payment request validation

`AgentPaymentRequestV1` requires version `1`, network `starknet`, `SN_SEPOLIA` or `SN_MAIN`, nonzero felt IDs/addresses/signature values, a positive base-unit amount, a resource string of 1–512 characters, four boolean privacy requirements, an unexpired timestamp no more than 24 hours ahead, and a Stark-curve authorization.

## Errors

| Error | Meaning | Submission |
|---|---|---|
| `INVALID_PAYMENT_REQUEST` | Shape, felt, expiry, resource, privacy, or signature validation failed | Not attempted |
| `WRONG_NETWORK` | SDK and request chain differ | Not attempted |
| `WALLET_NOT_PRIVACY_CAPABLE` | `pay` has no `WalletAccountV6` | Not attempted |
| Wallet/prover error during simulation | The wallet could not prepare the private actions | Submission not called by `pay` |
| Wallet timeout during submission | Outcome may be uncertain | Check wallet and chain evidence before retrying |
| GhostMode API HTTP error | Verification/status request failed | Payment may already have moved |

The SDK intentionally propagates wallet-native failures. Do not log raw errors if a wallet or provider may include sensitive context.

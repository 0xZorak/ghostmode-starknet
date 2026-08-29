# Privacy checker

The checker evaluates a typed intent before any wallet call. It does not read a balance, generate a proof, or submit a transaction.

## TypeScript API

```ts
import { evaluatePrivacy, calculatePrivacyScore } from "./src/lib/ghostmode";

const evaluation = evaluatePrivacy({
  action: "payment",
  network: "starknet-sepolia",
  token: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  amount: "100000000000000000",
  recipient: "0x123",
  requirements: {
    hideSender: true,
    hideRecipient: true,
    hideAmount: true,
    hideToken: true,
  },
  capabilities: {
    privacyWallet: true,
    privateInvoke: true,
    recipientRegistered: true,
  },
});

if (!evaluation.supported) {
  console.error(evaluation.errorCode, evaluation.reason);
} else {
  console.log(evaluation.route, calculatePrivacyScore(evaluation));
}
```

For this transfer-shaped intent, the expected route is `STRK20_PRIVATE_TRANSFER` and the current score is `80/100`.

## HTTP API

```bash
curl --request POST http://localhost:3000/api/privacy/evaluate \
  --header 'content-type: application/json' \
  --data '{
    "action":"payment",
    "network":"starknet-sepolia",
    "token":"0x4718",
    "amount":"100",
    "requirements":{
      "hideSender":true,
      "hideRecipient":true,
      "hideAmount":true,
      "hideToken":true
    },
    "capabilities":{
      "privacyWallet":true,
      "privateInvoke":true,
      "recipientRegistered":true
    }
  }'
```

Supported results use HTTP `200`; policy refusals use `422`; malformed JSON or intent shape uses `400`.

## Route rules

| Shape | Result |
|---|---|
| Payment/transfer with privacy wallet and registered recipient | `STRK20_PRIVATE_TRANSFER` |
| Contract invoke with requested fully private recipient/token/amount | `UNSUPPORTED`; helper and calldata/open output cannot meet those guarantees |
| No privacy properties requested | `PUBLIC_STARKNET` |
| Invalid token/amount felt | `UNSUPPORTED` with `INVALID_INTENT` |
| Missing privacy wallet capability | `UNSUPPORTED` with `PRIVATE_ROUTE_UNAVAILABLE` |

`capabilities` describe runtime facts supplied by the caller. The pure function does not contact a wallet or chain to prove them. The UI obtains wallet API versions during connection; production integrations should also preflight recipient registration and route configuration.

## Compatibility compiler

`analyzeCompatibility` answers a different question: can a Starknet action fit a direct transfer, first-party AVNU private swap, or one-invoke helper route? It rejects requirements for hidden general calldata/state and flows with more than one external invoke. The exported JSON is a design report, not generated audited Cairo.

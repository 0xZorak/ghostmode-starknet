# Privacy checker

The checker calls the same `evaluatePrivacy(intent)` function used by the SDK and API.

Inputs are the action, Starknet network, token, amount, optional recipient, requested confidentiality booleans, and runtime capabilities. Outputs contain a supported flag, exact route, actual exposure for each property, public leakage, warnings, per-property reasons, alternatives, and an explainable score.

## Refusal rules

- A requested private property is never executed through `PUBLIC_STARKNET`.
- A missing privacy wallet returns `PRIVATE_ROUTE_UNAVAILABLE`.
- An unregistered recipient blocks a private transfer when the capability is known.
- Contract invocation that requests hidden target, calldata, token, or amount is rejected because those surfaces can remain public.
- A route needing more than one external invocation is rejected by the compatibility compiler.

## Why every row exists

Sender, recipient, amount, and token correspond to encrypted-note properties. Timing remains public because Starknet orders the transaction in a public block. Entry and exit remain public because they cross the STRK20 boundary. Network metadata is out of scope because wallets, RPCs, and websites operate outside the proof.

Use `POST /api/privacy/evaluate` for server-side evaluation or import `evaluatePrivacy` directly. Treat a `422` as an intentional privacy refusal, not an infrastructure failure.

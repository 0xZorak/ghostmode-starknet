# Deployment

The live Sepolia product has three deployable parts: the Next.js app, Postgres, and the isolated seller verifier. ReceiptGate is a fourth, onchain dependency. The complete flow is not live until all four are verified.

## 1. Prepare public configuration

Deploy the current ReceiptGate only after its Cairo tests pass and a quote authority exists. Record the class hash, contract address, deployment transaction, pinned pool, and public authority in `deployments/sepolia.json`. Set `NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA` and the dedicated public seller address on the app host. Addresses are public; keys are not.

## 2. Create durable storage

Create Postgres, set server-only `DATABASE_URL`, and run `npm run db:migrate`. Use one database for all app replicas. The app deliberately refuses production quote issuance without durable storage. Verify `/api/health` reports `storage.ready=true` and `storage.durable=true`, then test process restart and concurrent claim attempts.

## 3. Deploy the Next.js app

Use Node 24 and `npm ci && npm run build`. Configure the root server variables from [configuration](configuration.md) in the host's secret manager. `NEXT_PUBLIC_` values are visible to every browser. Restrict production origins at the edge and add provider-level rate limits; the built-in limiter is per process and is only a last line of defense.

## 4. Deploy the seller verifier

The verifier is a separate private service. It must not share the public frontend process. Build its image with BuildKit so the package token never enters a layer:

```bash
docker build --secret id=npm_token,env=NODE_AUTH_TOKEN -t ghostmode-seller-verifier seller-verifier
```

Provide the variables in `seller-verifier/.env.example` through the container host's secret manager. Bind `HOST=0.0.0.0` only inside an authenticated private network or behind TLS and an access-controlled proxy. Keep a single replica until note-discovery state and concurrency are verified. The `/health` response must say ready before connecting the app.

## 5. Connect and verify

Set `GHOSTMODE_SELLER_VERIFIER_URL` and the same high-entropy verifier token on the root app. Run `npm run doctor`. Then exercise one low-value Sepolia flow: registration, shield, note maturity, private payment, exact gate event, exact seller note, one-time release, and replay refusal. Record only public evidence.

## Rollback

Disable quote issuance first by removing the signer or taking the paid endpoint offline. Keep verification/status endpoints available for already-submitted hashes when safe. Never silently point an existing quote flow at a different seller or gate. Restore from database backup, reconcile submitted quotes with chain evidence, and rotate any possibly exposed credential using [key management](key-management.md).

Mainnet remains blocked by `npm run mainnet:readiness`; no automated command may send real funds.

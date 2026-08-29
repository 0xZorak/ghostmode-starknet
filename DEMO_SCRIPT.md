# GhostMode Sepolia demo script

Target length: three minutes. Use only after `npm run doctor` is green and a complete Sepolia flow has already been rehearsed.

## 0:00–0:25 — Problem

“AI agents can pay for data and services, but a normal wallet exposes their suppliers, budgets, timing, and strategy. GhostMode is privacy-aware execution for agents on Starknet.” Show the privacy checker and its refusal to promise unsupported privacy.

## 0:25–0:55 — Quote and exposure

Open the included intelligence endpoint. Show the real HTTP 402 quote, price, chain, seller, ReceiptGate, and disclosure diff. Say: “The signed quote commits every payment term. GhostMode never silently falls back to a public transfer.”

## 0:55–1:30 — Shield

Connect the privacy-capable Sepolia wallet. Confirm the full account and network. Shield the smallest rehearsed amount and show the wallet approval, returned hash, and public pool evidence. Explain honestly that deposit amount and timing are public.

## 1:30–2:15 — Private purchase

After the note is mature, execute the purchase. Show the wallet simulation and the single STRK20 transaction containing encrypted transfer plus ReceiptGate invoke. Open the transaction on Voyager. Explain that the gate address and opaque receipt are public while normal encrypted-note payment fields and linkage stay private inside the pool.

## 2:15–2:40 — Verification and release

Show the successful gate event, exact seller note match, and resource unlock. Refresh status. Retry the same claim once to demonstrate replay rejection.

## 2:40–3:00 — Why Starknet

“Without STRK20, GhostMode would only analyze privacy and then pay publicly. Starknet gives us the pool, wallet-managed proof flow, and atomic Cairo helper call that turn policy into a real private application action.” End on the public repository, tests, license, and evidence hashes.

Never record secrets, raw verifier logs, decrypted notes, or wallet recovery material. Label any mocked or illustrative state on screen.

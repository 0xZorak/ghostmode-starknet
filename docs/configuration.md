# Configuration

Copy `.env.example` to `.env.local`. Empty optional values use the code's documented fallback. Never commit `.env.local` or `.secrets/`.

## Browser-visible configuration

Every `NEXT_PUBLIC_` value is bundled into client JavaScript. Treat it as public.

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `NEXT_PUBLIC_ALCHEMY_KEY` | No | none | Appends a browser RPC key to the built-in Alchemy URL. Restrict the key for public dApp use. |
| `NEXT_PUBLIC_STARKNET_SEPOLIA_RPC_URL` | No | Cartridge Sepolia RPC | Full browser RPC override. |
| `NEXT_PUBLIC_STARKNET_MAINNET_RPC_URL` | No | Cartridge Mainnet RPC | Full browser RPC override. |
| `NEXT_PUBLIC_PRIVACY_POOL_ADDRESS` | No | network-specific pinned pool | Explicit pool override. Verify code, chain, and network before setting it. |
| `NEXT_PUBLIC_GHOSTMODE_NETWORK` | No | `sepolia` | Selects `sepolia` unless the exact value is `mainnet`. |
| `NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA` | Live purchase | `0x0` | Current signed ReceiptGate on Sepolia. Zero disables submission. |
| `NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA` | Live purchase | `0x0` | Seller account registered with the selected Sepolia pool. |
| `NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET` | Mainnet purchase | `0x0` | Current signed ReceiptGate on Mainnet. |
| `NEXT_PUBLIC_GHOSTMODE_SELLER_MAINNET` | Mainnet purchase | `0x0` | Registered Mainnet seller. |
| `NEXT_PUBLIC_STRK20_ECHO_HELPER_SEPOLIA` | No | `0x0` | Optional Sepolia echo helper used by the legacy action panel. |

Addresses and public keys are not secrets, but an incorrect value can send a user to the wrong contract. Verify them independently.

## Root server-only configuration

| Variable | Required | Purpose |
|---|---:|---|
| `GHOSTMODE_SEPOLIA_RPC_URL` | No | Server routes and network scripts; defaults to Cartridge Sepolia. |
| `GHOSTMODE_MAINNET_RPC_URL` | No | Server routes and network scripts; defaults to Cartridge Mainnet. |
| `GHOSTMODE_SELLER_VERIFIER_URL` | Resource release | Exact `/verify-note` endpoint for the isolated verifier. |
| `GHOSTMODE_SELLER_VERIFIER_TOKEN` | Resource release | Shared bearer token for root-server to verifier calls. Secret. |
| `GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY` | Quote creation | Stark-curve key used only to authorize opaque receipt requests. Secret; not a funded account key. |
| `GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY` | Quote creation/deployment | Must match both the private key and ReceiptGate constructor value. Public. |
| `CONFIRM_MAINNET_TEST_MODE` | Mainnet demo startup | Must be `true` to run the demo preflight in mainnet mode. Does not authorize payments. |
| `CONFIRM_MAINNET_DEPLOYMENT` | Mainnet gate deployment | Must be `true` for `npm run deploy:mainnet`. Authorizes a real contract deployment. |
| `SNCAST_BIN` | No | Optional Mainnet deploy script override for `sncast`. |
| `SNCAST_ACCOUNTS_FILE` | No | Optional path to a gitignored sncast account file. Secret-bearing file. |
| `SNCAST_MAINNET_ACCOUNT_NAME` | No | Account alias used by the Mainnet deploy script. |

## Seller verifier configuration

These belong in `seller-verifier/.env.local`, not the root browser environment.

| Variable | Required | Purpose |
|---|---:|---|
| `PORT` | No | Loopback port; defaults to `8787`. |
| `GHOSTMODE_SELLER_VERIFIER_TOKEN` | Yes | Shared bearer token. Generate a high-entropy random value. |
| `SELLER_RPC_URL` | Yes | Sepolia Starknet RPC. |
| `SELLER_ACCOUNT_ADDRESS` | Yes | Dedicated seller account, registered in the pool. |
| `SELLER_ACCOUNT_PRIVATE_KEY` | Yes | Spending key required by the current SDK `Account` setup. Highest-risk secret. |
| `SELLER_VIEWING_KEY` | Yes | Persistent private note-discovery identity. Changing it loses access to that identity's note history. |
| `STRK20_POOL_ADDRESS` | Yes | Sepolia pool address used by this repository. |
| `STRK20_PROVING_SERVICE_URL` | Yes | STRK20 proving service; not an RPC. |
| `STRK20_INDEXER_URL` | Yes | STRK20 discovery/indexer service; not an RPC. |

## Secret-handling rules

- Do not prefix secrets with `NEXT_PUBLIC_`.
- Keep root and seller `.env.local` files gitignored.
- Keep `.secrets/sncast-accounts.json` gitignored and access-restricted.
- Use different low-value test accounts and keys from Mainnet identities.
- Never paste secrets into issues, screenshots, build logs, or client error messages.
- Rotate the verifier bearer token after suspected disclosure.
- Quote-signing key compromise cannot spend seller funds, but it can authorize fraudulent quotes; rotate and migrate the gate authority.

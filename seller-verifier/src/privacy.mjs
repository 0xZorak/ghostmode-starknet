import { Account, RpcProvider, constants } from "starknet";
import { createPrivateTransfers } from "@starkware-libs/starknet-privacy-sdk";

const requiredNames = [
  "SELLER_RPC_URL",
  "SELLER_ACCOUNT_ADDRESS",
  "SELLER_ACCOUNT_PRIVATE_KEY",
  "SELLER_VIEWING_KEY",
  "STRK20_POOL_ADDRESS",
  "STRK20_PROVING_SERVICE_URL",
  "STRK20_INDEXER_URL",
];

for (const name of requiredNames) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

// STRK20 proof facts are part of the v3 transaction hash. Pinning the RPC
// schema prevents an older endpoint from signing different data than the
// Argent account validates onchain.
export const provider = new RpcProvider({
  nodeUrl: process.env.SELLER_RPC_URL,
  specVersion: "0.10.3",
});

export const account = new Account({
  provider,
  address: process.env.SELLER_ACCOUNT_ADDRESS,
  signer: process.env.SELLER_ACCOUNT_PRIVATE_KEY,
  cairoVersion: "1",
});

export const transfers = createPrivateTransfers({
  account,
  viewingKeyProvider: { getViewingKey: async () => BigInt(process.env.SELLER_VIEWING_KEY) },
  provingProvider: {
    url: process.env.STRK20_PROVING_SERVICE_URL,
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    nodeUrl: process.env.SELLER_RPC_URL,
  },
  discoveryProvider: { url: process.env.STRK20_INDEXER_URL },
  poolContractAddress: process.env.STRK20_POOL_ADDRESS,
});

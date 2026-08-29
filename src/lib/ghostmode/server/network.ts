import "server-only";

import type { GhostModeNetwork } from "@/utils/constants";

const DEFAULT_RPC: Record<GhostModeNetwork, string> = {
  sepolia: "https://api.cartridge.gg/x/starknet/sepolia",
  mainnet: "https://api.cartridge.gg/x/starknet/mainnet",
};

/** Returns the server-side RPC for a GhostMode network without exposing it to the browser. */
export function ghostModeServerRpcUrl(network: GhostModeNetwork): string {
  return network === "mainnet"
    ? process.env.GHOSTMODE_MAINNET_RPC_URL || DEFAULT_RPC.mainnet
    : process.env.GHOSTMODE_SEPOLIA_RPC_URL || DEFAULT_RPC.sepolia;
}

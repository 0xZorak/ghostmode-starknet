import { constants, RpcProvider } from "starknet";

const network = process.env.NEXT_PUBLIC_GHOSTMODE_NETWORK === "mainnet" ? "mainnet" : "sepolia";
if (network === "mainnet" && process.env.CONFIRM_MAINNET_TEST_MODE !== "true") {
  console.error("Demo blocked on mainnet. Use Sepolia or set CONFIRM_MAINNET_TEST_MODE=true after reviewing the real-funds warning.");
  process.exit(2);
}
const provider = new RpcProvider({
  nodeUrl: network === "mainnet"
    ? process.env.GHOSTMODE_MAINNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet"
    : process.env.GHOSTMODE_SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
});
const expected = network === "mainnet" ? constants.StarknetChainId.SN_MAIN : constants.StarknetChainId.SN_SEPOLIA;
const actual = await provider.getChainId();
if (actual !== expected) throw new Error(`RPC returned ${actual}; expected ${expected}.`);
console.log(`GhostMode demo preflight passed on ${network}. Starting the app…`);

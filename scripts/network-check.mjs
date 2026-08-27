import { RpcProvider, constants, num, validateAndParseAddress } from "starknet";

const target = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (target !== "mainnet" && target !== "sepolia") {
  console.error("Usage: node scripts/network-check.mjs <mainnet|sepolia> [--dry-run]");
  process.exit(2);
}

const mainnet = target === "mainnet";
const chainId = mainnet ? constants.StarknetChainId.SN_MAIN : constants.StarknetChainId.SN_SEPOLIA;
const networkName = mainnet ? "SN_MAIN" : "SN_SEPOLIA";
const pool = mainnet
  ? "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a"
  : "0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91";
const token = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const rpc = mainnet
  ? process.env.GHOSTMODE_MAINNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet"
  : process.env.GHOSTMODE_SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia";
const gateInput = mainnet
  ? process.env.NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET
  : process.env.NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA;
const provider = new RpcProvider({ nodeUrl: rpc });

const result = {
  mode: dryRun ? "READ_ONLY_DRY_RUN" : "READ_ONLY_CHECK",
  network: networkName,
  rpc: "FAIL",
  privacyPool: "FAIL",
  token: "FAIL",
  receiptContract: "NOT_CONFIGURED",
  receiptPoolBinding: "NOT_CHECKED",
  walletPrivacyApi: "RUNTIME_CHECK_REQUIRED",
  sellerVerifier: process.env.GHOSTMODE_SELLER_VERIFIER_URL ? "CONFIGURED_NOT_CALLED" : "NOT_CONFIGURED",
  feeEstimate: dryRun ? "NOT_AVAILABLE_WITHOUT_A_CONNECTED_PRIVACY_WALLET_AND_PREPARED_PROOF" : "NOT_REQUESTED",
  transactionSubmitted: false,
};

try {
  result.rpc = (await provider.getChainId()) === chainId ? "PASS" : "WRONG_CHAIN";
  await provider.getClassHashAt(pool);
  result.privacyPool = "PASS";
  await provider.getClassHashAt(token);
  result.token = "PASS";
  if (gateInput && num.toBigInt(gateInput) > 0n) {
    const gate = validateAndParseAddress(gateInput);
    await provider.getClassHashAt(gate);
    result.receiptContract = "PASS";
    const [configuredPool] = await provider.callContract({ contractAddress: gate, entrypoint: "get_pool" });
    result.receiptPoolBinding = num.toBigInt(configuredPool) === num.toBigInt(pool) ? "PASS" : "FAIL";
  }
} catch {
  // The per-check states above intentionally identify how far validation got.
}

console.log(JSON.stringify(result, null, 2));
if (result.rpc !== "PASS" || result.privacyPool !== "PASS" || result.token !== "PASS") process.exit(1);

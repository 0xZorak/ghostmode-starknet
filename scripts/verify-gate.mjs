import { RpcProvider, num, validateAndParseAddress } from "starknet";

const EXPECTED_SEPOLIA_POOL = "0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91";
const gateInput = process.argv[2] || process.env.NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA;

if (!gateInput || gateInput === "0x0") {
  console.error("Usage: npm run gate:verify -- 0x<deployed_gate_address>");
  process.exit(2);
}

const gate = validateAndParseAddress(gateInput);
const provider = new RpcProvider({
  nodeUrl: process.env.GHOSTMODE_SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
});

const [configuredPool] = await provider.callContract({
  contractAddress: gate,
  entrypoint: "get_pool",
});
const [sellerAuthorityKey] = await provider.callContract({
  contractAddress: gate,
  entrypoint: "get_seller_authority_key",
});

const expectedAuthorityKey = process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY;
const poolValid = num.toBigInt(configuredPool) === num.toBigInt(EXPECTED_SEPOLIA_POOL);
const authorityValid = !expectedAuthorityKey || num.toBigInt(sellerAuthorityKey) === num.toBigInt(expectedAuthorityKey);
const valid = poolValid && authorityValid;
console.log(JSON.stringify({
  network: "SN_SEPOLIA",
  gate,
  configuredPool,
  expectedPool: EXPECTED_SEPOLIA_POOL,
  sellerAuthorityKey,
  authorityMatchesEnvironment: expectedAuthorityKey ? authorityValid : "NOT_CHECKED",
  valid,
}, null, 2));

if (!valid) process.exit(1);

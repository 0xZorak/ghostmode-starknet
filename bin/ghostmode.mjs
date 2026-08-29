#!/usr/bin/env node
import { ec, num, RpcProvider } from "starknet";
import postgres from "postgres";

const command = process.argv[2] || "doctor";

function configuredFelt(value) {
  try { return num.toBigInt(value || "0x0") > 0n; } catch { return false; }
}

async function doctor() {
  const network = process.env.NEXT_PUBLIC_GHOSTMODE_NETWORK === "mainnet" ? "mainnet" : "sepolia";
  const rpcUrl = network === "mainnet"
    ? process.env.GHOSTMODE_MAINNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet"
    : process.env.GHOSTMODE_SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia";
  const pool = process.env.NEXT_PUBLIC_PRIVACY_POOL_ADDRESS || (network === "mainnet"
    ? "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a"
    : "0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91");
  const gate = network === "mainnet" ? process.env.NEXT_PUBLIC_GHOSTMODE_GATE_MAINNET : process.env.NEXT_PUBLIC_GHOSTMODE_GATE_SEPOLIA;
  const seller = network === "mainnet" ? process.env.NEXT_PUBLIC_GHOSTMODE_SELLER_MAINNET : process.env.NEXT_PUBLIC_GHOSTMODE_SELLER_SEPOLIA;
  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const report = {
    node: { status: Number(process.versions.node.split(".")[0]) >= 24 ? "PASS" : "FAIL", required: ">=24" },
    network,
    rpc: { status: "FAIL" },
    strk20Pool: { status: "FAIL", address: pool },
    receiptGate: { status: configuredFelt(gate) ? "UNVERIFIED" : "NOT_CONFIGURED" },
    seller: { status: configuredFelt(seller) ? "CONFIGURED_NOT_VERIFIED" : "NOT_CONFIGURED" },
    quoteSigner: { status: "NOT_CONFIGURED" },
    sellerVerifier: { status: "NOT_CONFIGURED" },
    storage: { status: "NOT_CONFIGURED" },
    wallet: { status: "USER_RUNTIME_CHECK_REQUIRED", requirement: "Wallet API >=0.10.3" },
  };
  try { await provider.getChainId(); report.rpc.status = "PASS"; } catch { report.rpc.status = "UNREACHABLE"; }
  try { await provider.getClassHashAt(pool); report.strk20Pool.status = "PASS"; } catch { report.strk20Pool.status = "UNREACHABLE"; }
  const privateKey = process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY;
  const publicKey = process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY;
  if (privateKey && publicKey) {
    report.quoteSigner.status = num.toBigInt(ec.starkCurve.getStarkKey(privateKey)) === num.toBigInt(publicKey) ? "PASS" : "KEY_MISMATCH";
  }
  if (configuredFelt(gate)) {
    try {
      const [poolOnchain] = await provider.callContract({ contractAddress: gate, entrypoint: "get_pool" });
      const [keyOnchain] = await provider.callContract({ contractAddress: gate, entrypoint: "get_seller_authority_key" });
      report.receiptGate.status = num.toBigInt(poolOnchain) === num.toBigInt(pool) && publicKey && num.toBigInt(keyOnchain) === num.toBigInt(publicKey) ? "PASS" : "CONFIG_MISMATCH";
    } catch { report.receiptGate.status = "UNREACHABLE_OR_OLD_ABI"; }
  }
  if (process.env.GHOSTMODE_SELLER_VERIFIER_URL) {
    try {
      const url = new URL(process.env.GHOSTMODE_SELLER_VERIFIER_URL); url.pathname = "/health"; url.search = "";
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      report.sellerVerifier.status = response.ok ? "PASS" : `HTTP_${response.status}`;
    } catch { report.sellerVerifier.status = "UNREACHABLE"; }
  }
  if (process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 5 });
    try { await sql`select 1`; report.storage.status = "PASS"; } catch { report.storage.status = "UNREACHABLE"; } finally { await sql.end().catch(() => {}); }
  }
  console.log(JSON.stringify(report, null, 2));
  const required = [report.node.status, report.rpc.status, report.strk20Pool.status, report.receiptGate.status, report.quoteSigner.status, report.sellerVerifier.status, report.storage.status];
  process.exitCode = required.every((status) => status === "PASS") ? 0 : 1;
}

async function status() {
  const base = process.argv[3] || process.env.GHOSTMODE_APP_URL || "http://127.0.0.1:3000";
  const response = await fetch(new URL("/api/health", base), { signal: AbortSignal.timeout(10_000) });
  console.log(JSON.stringify(await response.json(), null, 2));
  process.exitCode = response.ok ? 0 : 1;
}

if (command === "doctor" || command === "check") await doctor();
else if (command === "status") await status();
else {
  console.error("Usage: ghostmode {doctor|check|status [app-url]}");
  process.exitCode = 2;
}

import { NextResponse } from "next/server";
import { RpcProvider, constants, num } from "starknet";
import { GhostModeGate, GhostModePoolAddress, GhostModeTargetNetwork } from "@/utils/constants";
import { ghostModeServerRpcUrl } from "@/lib/ghostmode/server/network";
import { quoteStoreDurable, quoteStoreMode, quoteStoreReady } from "@/lib/ghostmode/server/quote-store";

export const dynamic = "force-dynamic";

const rpcUrl = ghostModeServerRpcUrl(GhostModeTargetNetwork);

function configured(value: string) {
  try { return num.toBigInt(value) > 0n; } catch { return false; }
}

async function contractStatus(provider: RpcProvider, address: string) {
  if (!configured(address)) return "not_configured" as const;
  try {
    await provider.getClassHashAt(address);
    return "ok" as const;
  } catch {
    return "unavailable" as const;
  }
}

async function sellerVerifierStatus() {
  const configuredUrl = process.env.GHOSTMODE_SELLER_VERIFIER_URL;
  if (!configuredUrl) return "not_configured" as const;
  try {
    const url = new URL(configuredUrl);
    url.pathname = "/health";
    url.search = "";
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4_000) });
    return response.ok ? "ok" as const : "unavailable" as const;
  } catch {
    return "unavailable" as const;
  }
}

export async function GET() {
  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  let rpc: "ok" | "unavailable" | "wrong_chain" = "unavailable";
  try {
    const actual = await provider.getChainId();
    const expected = GhostModeTargetNetwork === "mainnet"
      ? constants.StarknetChainId.SN_MAIN
      : constants.StarknetChainId.SN_SEPOLIA;
    rpc = actual === expected ? "ok" : "wrong_chain";
  } catch {
    rpc = "unavailable";
  }
  const [privacy, receiptContract, sellerVerifier] = await Promise.all([
    contractStatus(provider, GhostModePoolAddress),
    contractStatus(provider, GhostModeGate),
    sellerVerifierStatus(),
  ]);
  let receiptAuthorization: "ok" | "not_configured" | "mismatch" | "unavailable" = "not_configured";
  if (receiptContract === "ok") {
    try {
      const [onchainKey] = await provider.callContract({ contractAddress: GhostModeGate, entrypoint: "get_seller_authority_key" });
      const expectedKey = process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY;
      receiptAuthorization = !expectedKey
        ? "not_configured"
        : num.toBigInt(onchainKey) === num.toBigInt(expectedKey) ? "ok" : "mismatch";
    } catch {
      receiptAuthorization = "unavailable";
    }
  }
  const healthy = rpc === "ok" && privacy === "ok";
  const storage = { status: quoteStoreReady() ? "ready" : "not_configured", mode: quoteStoreMode(), durable: quoteStoreDurable() };
  const quoteSigner = process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY && process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY
    ? { status: "configured" as const }
    : { status: "not_configured" as const };
  const ready = healthy && receiptContract === "ok" && receiptAuthorization === "ok" && sellerVerifier === "ok" && storage.status === "ready" && storage.durable;
  return NextResponse.json({
    status: ready ? "ready" : "degraded",
    app: "ok",
    network: GhostModeTargetNetwork,
    rpc,
    privacy,
    receiptContract,
    receiptAuthorization,
    sellerVerifier,
    storage,
    quoteSigner,
    prover: { status: "wallet_managed", note: "Buyer proving is delegated to the privacy-enabled wallet." },
    indexer: { status: "wallet_managed", note: "Buyer discovery is delegated to the privacy-enabled wallet; seller discovery is reported by sellerVerifier." },
    components: {
      rpc: { status: rpc },
      strk20: { status: privacy, address: GhostModePoolAddress },
      receiptGate: { status: receiptContract, address: GhostModeGate, authorization: receiptAuthorization },
      quoteSigner,
      sellerVerifier: { status: sellerVerifier },
      storage,
    },
    ready,
  }, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

import { NextResponse } from "next/server";
import { ec, num, RpcProvider } from "starknet";
import { GhostModeGate, GhostModeSeller, GhostModeTargetNetwork } from "@/utils/constants";
import { quoteStoreDurable, quoteStoreMode, quoteStoreReady } from "@/lib/ghostmode/server/quote-store";
import { ghostModeServerRpcUrl } from "@/lib/ghostmode/server/network";

export const dynamic = "force-dynamic";

function configured(address: string) {
  try {
    return num.toBigInt(address) !== 0n;
  } catch {
    return false;
  }
}

export async function GET() {
  const signerPrivateKey = process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY;
  const signerPublicKey = process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY;
  let receiptAuthorizationConfigured = false;
  if (configured(GhostModeGate) && signerPrivateKey && signerPublicKey) {
    try {
      const derivedKey = ec.starkCurve.getStarkKey(signerPrivateKey);
      const provider = new RpcProvider({
        nodeUrl: ghostModeServerRpcUrl(GhostModeTargetNetwork),
      });
      const [onchainKey] = await provider.callContract({ contractAddress: GhostModeGate, entrypoint: "get_seller_authority_key" });
      receiptAuthorizationConfigured = num.toBigInt(derivedKey) === num.toBigInt(signerPublicKey)
        && num.toBigInt(onchainKey) === num.toBigInt(signerPublicKey);
    } catch {
      receiptAuthorizationConfigured = false;
    }
  }
  const checks = {
    network: GhostModeTargetNetwork,
    receiptGateConfigured: configured(GhostModeGate),
    sellerConfigured: configured(GhostModeSeller),
    sellerVerifierConfigured: Boolean(process.env.GHOSTMODE_SELLER_VERIFIER_URL && process.env.GHOSTMODE_SELLER_VERIFIER_TOKEN),
    quoteSignerConfigured: Boolean(signerPrivateKey && signerPublicKey),
    receiptAuthorizationConfigured,
    quoteStore: quoteStoreMode(),
    storageReady: quoteStoreReady(),
    storageDurable: quoteStoreDurable(),
  };
  return NextResponse.json({
    readyForShieldTesting: true,
    readyForPrivatePurchaseTesting: checks.receiptGateConfigured && checks.sellerConfigured && checks.receiptAuthorizationConfigured,
    readyForResourceUnlockTesting: checks.receiptGateConfigured && checks.sellerConfigured && checks.receiptAuthorizationConfigured && checks.sellerVerifierConfigured && checks.storageReady && checks.storageDurable,
    checks,
  }, { headers: { "Cache-Control": "no-store" } });
}

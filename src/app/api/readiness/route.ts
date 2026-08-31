import { NextResponse } from "next/server";
import { ec, num, RpcProvider } from "starknet";
import { GhostModeGate, GhostModePoolAddress, GhostModeSeller, GhostModeTargetNetwork } from "@/utils/constants";
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
  const provider = new RpcProvider({
    nodeUrl: ghostModeServerRpcUrl(GhostModeTargetNetwork),
  });
  let receiptAuthorizationConfigured = false;
  if (configured(GhostModeGate) && signerPrivateKey && signerPublicKey) {
    try {
      const derivedKey = ec.starkCurve.getStarkKey(signerPrivateKey);
      const [onchainKey] = await provider.callContract({ contractAddress: GhostModeGate, entrypoint: "get_seller_authority_key" });
      receiptAuthorizationConfigured = num.toBigInt(derivedKey) === num.toBigInt(signerPublicKey)
        && num.toBigInt(onchainKey) === num.toBigInt(signerPublicKey);
    } catch {
      receiptAuthorizationConfigured = false;
    }
  }
  let sellerRegistered = false;
  let poolFee = "0";
  try {
    const [fee = "0x0"] = await provider.callContract({
      contractAddress: GhostModePoolAddress,
      entrypoint: "get_fee_amount",
    });
    poolFee = num.toBigInt(fee).toString();
  } catch {
    poolFee = "0";
  }
  if (configured(GhostModeSeller)) {
    try {
      const [sellerPublicKey = "0x0"] = await provider.callContract({
        contractAddress: GhostModePoolAddress,
        entrypoint: "get_public_key",
        calldata: [GhostModeSeller],
      });
      sellerRegistered = num.toBigInt(sellerPublicKey) !== 0n;
    } catch {
      sellerRegistered = false;
    }
  }
  const checks = {
    network: GhostModeTargetNetwork,
    receiptGateConfigured: configured(GhostModeGate),
    sellerConfigured: configured(GhostModeSeller),
    sellerRegistered,
    poolFee,
    sellerVerifierConfigured: Boolean(process.env.GHOSTMODE_SELLER_VERIFIER_URL && process.env.GHOSTMODE_SELLER_VERIFIER_TOKEN),
    quoteSignerConfigured: Boolean(signerPrivateKey && signerPublicKey),
    receiptAuthorizationConfigured,
    quoteStore: quoteStoreMode(),
    storageReady: quoteStoreReady(),
    storageDurable: quoteStoreDurable(),
  };
  const privatePurchaseReady = checks.receiptGateConfigured
    && checks.sellerConfigured
    && checks.sellerRegistered
    && checks.receiptAuthorizationConfigured;
  const resourceUnlockReady = privatePurchaseReady
    && checks.sellerVerifierConfigured
    && checks.storageReady;
  return NextResponse.json({
    readyForShieldTesting: true,
    readyForPrivatePurchaseTesting: privatePurchaseReady,
    // Ephemeral storage is sufficient for a single-process local E2E test.
    // Production remains explicitly false until storage is durable.
    readyForResourceUnlockTesting: resourceUnlockReady,
    readyForProduction: resourceUnlockReady && checks.storageDurable,
    checks,
  }, { headers: { "Cache-Control": "no-store" } });
}

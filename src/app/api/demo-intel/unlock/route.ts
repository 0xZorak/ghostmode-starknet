import { NextRequest, NextResponse } from "next/server";
import { RpcProvider } from "starknet";
import {
  beginQuoteVerification,
  findQuote,
  releaseQuote,
  resetQuoteVerification,
} from "@/lib/ghostmode/server/quote-store";
import { verifyGateReceipt, verifySellerNote } from "@/lib/ghostmode/server/payment-verification";
import { GhostModeTargetNetwork } from "@/utils/constants";
import { ghostModeServerRpcUrl } from "@/lib/ghostmode/server/network";

export const dynamic = "force-dynamic";

const provider = new RpcProvider({
  nodeUrl: ghostModeServerRpcUrl(GhostModeTargetNetwork),
});

export async function POST(request: NextRequest) {
  let body: { quoteId?: unknown; requestId?: unknown; transactionHash?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const quoteId = typeof body.requestId === "string" ? body.requestId : body.quoteId;
  if (typeof quoteId !== "string" || typeof body.transactionHash !== "string") {
    return NextResponse.json({ error: "requestId_and_transactionHash_are_required" }, { status: 400 });
  }

  const stored = findQuote(quoteId);
  if (!stored) return NextResponse.json({ error: "quote_not_found_or_expired" }, { status: 404 });
  const claim = beginQuoteVerification(quoteId, body.transactionHash);
  if (!claim.ok) {
    return NextResponse.json({
      error: claim.reason === "already_used" ? "PAYMENT_ALREADY_USED" : "PAYMENT_VERIFICATION_IN_PROGRESS",
      resourceReleased: false,
    }, { status: 409 });
  }

  try {
    const receipt = await provider.getTransactionReceipt(body.transactionHash);
    const gate = verifyGateReceipt(receipt, stored.quote);
    if (!gate.accepted) {
      resetQuoteVerification(quoteId, body.transactionHash);
      return NextResponse.json({
        error: "receipt_gate_not_verified",
        gate,
        resourceReleased: false,
      }, { status: 422 });
    }

    const seller = await verifySellerNote(stored.quote, body.transactionHash);
    if (!seller.verified) {
      resetQuoteVerification(quoteId, body.transactionHash);
      return NextResponse.json({
        error: seller.reason,
        gate,
        seller,
        resourceReleased: false,
        message: "The public receipt is valid, but content stays locked until the seller discovers the matching private note.",
      }, { status: 409 });
    }

    if (!releaseQuote(quoteId, body.transactionHash, seller.noteId!)) {
      return NextResponse.json({ error: "PAYMENT_ALREADY_USED", resourceReleased: false }, { status: 409 });
    }
    return NextResponse.json({
      paid: true,
      gate,
      seller: { verified: true, noteId: seller.noteId },
      resourceCommitment: stored.quote.resourceCommitment,
      resourceReleased: true,
      resource: stored.resource,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    resetQuoteVerification(quoteId, body.transactionHash);
    return NextResponse.json({
      error: "verification_failed",
      message: "The transaction receipt could not be verified. No resource was released.",
      resourceReleased: false,
    }, { status: 502 });
  }
}

import { type NextRequest, NextResponse } from "next/server";
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
import { unlockRequestSchema } from "@/lib/ghostmode/server/validation";
import { errorPayload } from "@/lib/ghostmode/errors";
import { checkRateLimit } from "@/lib/ghostmode/server/rate-limit";

export const dynamic = "force-dynamic";

const provider = new RpcProvider({
  nodeUrl: ghostModeServerRpcUrl(GhostModeTargetNetwork),
});

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "unlock", 30);
  if (!rate.allowed) return NextResponse.json({ error: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = unlockRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(errorPayload("QUOTE_INVALID", "The claim request is malformed.", { action: "Request a fresh quote and submit its exact request ID and transaction hash." }), { status: 400 });
  const quoteId = parsed.data.requestId ?? parsed.data.quoteId;
  if (!quoteId) return NextResponse.json(errorPayload("QUOTE_INVALID", "A quote ID is required.", { action: "Request a fresh quote and submit its request ID." }), { status: 400 });
  const transactionHash = parsed.data.transactionHash;

  const stored = await findQuote(quoteId);
  if (!stored) return NextResponse.json({ error: "quote_not_found_or_expired" }, { status: 404 });
  const claim = await beginQuoteVerification(quoteId, transactionHash);
  if (!claim.ok) {
    return NextResponse.json({
      error: claim.reason === "already_used" || claim.reason === "transaction_reused"
        ? "PAYMENT_ALREADY_USED"
        : claim.reason === "not_found" ? "PAYMENT_NOT_FOUND" : "PAYMENT_VERIFICATION_IN_PROGRESS",
      resourceReleased: false,
    }, { status: 409 });
  }

  try {
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const gate = verifyGateReceipt(receipt, stored.quote);
    if (!gate.accepted) {
      await resetQuoteVerification(quoteId, transactionHash);
      return NextResponse.json({
        error: "receipt_gate_not_verified",
        gate,
        resourceReleased: false,
      }, { status: 422 });
    }

    const seller = await verifySellerNote(stored.quote, transactionHash);
    if (!seller.verified) {
      await resetQuoteVerification(quoteId, transactionHash);
      return NextResponse.json({
        error: seller.reason,
        gate,
        seller,
        resourceReleased: false,
        message: "The public receipt is valid, but content stays locked until the seller discovers the matching private note.",
      }, { status: 409 });
    }

    const noteId = seller.noteId;
    if (!noteId) {
      await resetQuoteVerification(quoteId, transactionHash);
      return NextResponse.json({ error: "SELLER_NOTE_NOT_FOUND", resourceReleased: false }, { status: 409 });
    }
    if (!await releaseQuote(quoteId, transactionHash, noteId)) {
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
    await resetQuoteVerification(quoteId, transactionHash);
    return NextResponse.json({
      error: "verification_failed",
      message: "The transaction receipt could not be verified. No resource was released.",
      resourceReleased: false,
    }, { status: 502 });
  }
}

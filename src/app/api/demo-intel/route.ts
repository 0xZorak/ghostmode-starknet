import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  addrSTRK,
  GhostModeChainId,
  GhostModeGate,
  GhostModeSeller,
  GhostModeTargetNetwork,
} from "@/utils/constants";
import type { PaymentQuote } from "@/lib/ghostmode/types";
import { saveQuote } from "@/lib/ghostmode/server/quote-store";
import { signReceiptAuthorization } from "@/lib/ghostmode/server/quote-authorization";
import { computeQuoteId, computeQuoteTermsCommitment } from "@/lib/ghostmode/quote-integrity";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/ghostmode/server/rate-limit";

export const dynamic = "force-dynamic";

function feltFrom(input: string): string {
  const digest = createHash("sha256").update(input).digest("hex");
  return `0x${digest.slice(0, 62)}`;
}

function createQuote(): { quote: PaymentQuote; resource: unknown } {
  const resource = {
    schema: "threat-report/v1",
    generatedAt: new Date().toISOString(),
    records: 24,
    source: "ghostmode-demo-seller",
    indicators: ["private-agent-budget-drain", "quote-replay-attempt", "untrusted-tool-payment"],
  };
  const report = JSON.stringify(resource);
  const nonce = `0x${randomBytes(24).toString("hex")}`;

  const validUntil = Math.floor(Date.now() / 1000) + 15 * 60;
  const resourceCommitment = feltFrom(report);
  const termsCommitment = computeQuoteTermsCommitment({
    chainId: GhostModeChainId,
    seller: GhostModeSeller,
    gate: GhostModeGate,
    token: addrSTRK,
    amount: (10n ** 17n).toString(),
    resourceCommitment,
    nonce,
  });
  const quoteId = computeQuoteId(termsCommitment);
  const { authorization } = signReceiptAuthorization(GhostModeGate, quoteId, resourceCommitment, validUntil);
  const quote: PaymentQuote = {
    version: "ghostmode-http402/0.2",
    network: GhostModeTargetNetwork,
    chainId: GhostModeChainId,
    quoteId,
    nonce,
    termsCommitment,
    resourceCommitment,
    seller: GhostModeSeller,
    gate: GhostModeGate,
    token: addrSTRK,
    amount: (10n ** 17n).toString(),
    validUntil,
    authorization,
    resource: {
      name: "Starknet threat-intelligence snapshot",
      mediaType: "application/vnd.ghostmode.threat-report+json",
      preview: "24 signed indicators · generated for this request",
    },
    proof: {
      type: "commitment",
      statement: "The delivered bytes must hash to resourceCommitment. Semantic quality is not claimed.",
    },
  };
  return { quote, resource };
}

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, "quote", 20);
  if (!rate.allowed) return NextResponse.json({ error: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  let created: ReturnType<typeof createQuote>;
  try {
    created = createQuote();
  } catch (error) {
    const code = error instanceof Error ? error.message : "QUOTE_CREATION_FAILED";
    return NextResponse.json({ error: code, message: "The seller quote signer is unavailable. No payment was requested." }, { status: 503 });
  }
  const { quote, resource } = created;
  try {
    await saveQuote({ quote, resource, createdAt: Date.now() });
  } catch (error) {
    const code = error instanceof Error && error.message === "STORAGE_NOT_CONFIGURED"
      ? "STORAGE_NOT_CONFIGURED"
      : "STORAGE_UNAVAILABLE";
    return NextResponse.json({ error: code, message: "The quote store is unavailable. No payment was requested." }, { status: 503 });
  }
  return NextResponse.json(
    {
      error: "payment_required",
      message: "This resource requires a private STRK20 payment.",
      quote,
    },
    {
      status: 402,
      headers: {
        "Cache-Control": "no-store",
        "Payment-Required": Buffer.from(JSON.stringify(quote)).toString("base64url"),
      },
    },
  );
}

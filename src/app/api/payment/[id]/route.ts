import { type NextRequest, NextResponse } from "next/server";
import { findQuote, publicQuoteStatus } from "@/lib/ghostmode/server/quote-store";
import { checkRateLimit } from "@/lib/ghostmode/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const rate = checkRateLimit(_request, "payment-status", 120);
  if (!rate.allowed) return NextResponse.json({ error: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const { id } = await context.params;
  const record = await findQuote(id);
  if (!record) return NextResponse.json({ error: "PAYMENT_NOT_FOUND_OR_EXPIRED" }, { status: 404 });
  return NextResponse.json(publicQuoteStatus(record), { headers: { "Cache-Control": "no-store" } });
}

import { NextRequest, NextResponse } from "next/server";
import { findQuote, publicQuoteStatus } from "@/lib/ghostmode/server/quote-store";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const record = findQuote(id);
  if (!record) return NextResponse.json({ error: "PAYMENT_NOT_FOUND_OR_EXPIRED" }, { status: 404 });
  return NextResponse.json(publicQuoteStatus(record), { headers: { "Cache-Control": "no-store" } });
}

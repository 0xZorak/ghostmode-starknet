import { type NextRequest, NextResponse } from "next/server";
import { evaluatePrivacy } from "@/lib/ghostmode/privacy-engine";
import { calculatePrivacyScore } from "@/lib/ghostmode/privacy-score";
import { privacyIntentSchema } from "@/lib/ghostmode/server/validation";
import { checkRateLimit } from "@/lib/ghostmode/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, "privacy-evaluate", 60);
  if (!rate.allowed) return NextResponse.json({ error: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = privacyIntentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_PRIVACY_INTENT", issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 400 });
  const intent = parsed.data;
  const evaluation = evaluatePrivacy(intent);
  return NextResponse.json({ evaluation, score: calculatePrivacyScore(evaluation) }, {
    status: evaluation.supported ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}

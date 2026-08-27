import { NextRequest, NextResponse } from "next/server";
import { evaluatePrivacy } from "@/lib/ghostmode/privacy-engine";
import { calculatePrivacyScore } from "@/lib/ghostmode/privacy-score";
import type { PrivacyIntent } from "@/lib/ghostmode/types";

export const dynamic = "force-dynamic";

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function parseIntent(value: unknown): PrivacyIntent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const requirements = input.requirements as Record<string, unknown> | undefined;
  if (!["payment", "transfer", "contract-invoke", "swap"].includes(String(input.action))
    || !["starknet-sepolia", "starknet-mainnet"].includes(String(input.network))
    || typeof input.token !== "string"
    || typeof input.amount !== "string"
    || !requirements
    || ![requirements.hideSender, requirements.hideRecipient, requirements.hideAmount, requirements.hideToken].every(isBoolean)) return null;
  return input as unknown as PrivacyIntent;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const intent = parseIntent(body);
  if (!intent) return NextResponse.json({ error: "INVALID_PRIVACY_INTENT" }, { status: 400 });
  const evaluation = evaluatePrivacy(intent);
  return NextResponse.json({ evaluation, score: calculatePrivacyScore(evaluation) }, {
    status: evaluation.supported ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}

import type { NextRequest } from "next/server";

type Counter = { count: number; resetAt: number };

declare global {
  var ghostModeRateLimits: Map<string, Counter> | undefined;
}

const counters = globalThis.ghostModeRateLimits ?? new Map<string, Counter>();
globalThis.ghostModeRateLimits = counters;

export function checkRateLimit(request: NextRequest, bucket: string, limit: number, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "unknown";
  const key = `${bucket}:${client}`;
  const now = Date.now();
  const existing = counters.get(key);
  const record = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  record.count += 1;
  counters.set(key, record);
  if (counters.size > 10_000) for (const [candidate, value] of counters) if (value.resetAt <= now) counters.delete(candidate);
  return { allowed: record.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)) };
}

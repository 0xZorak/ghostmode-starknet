import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./rate-limit";

function request(ip: string) {
  return { headers: new Headers({ "x-forwarded-for": ip }) } as NextRequest;
}

describe("rate limiting", () => {
  it("allows the configured budget and then rejects the same client", () => {
    const bucket = `test-${crypto.randomUUID()}`;
    expect(checkRateLimit(request("192.0.2.1"), bucket, 2).allowed).toBe(true);
    expect(checkRateLimit(request("192.0.2.1"), bucket, 2).allowed).toBe(true);
    const rejected = checkRateLimit(request("192.0.2.1"), bucket, 2);
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isolates clients within a bucket", () => {
    const bucket = `test-${crypto.randomUUID()}`;
    expect(checkRateLimit(request("192.0.2.2"), bucket, 1).allowed).toBe(true);
    expect(checkRateLimit(request("192.0.2.3"), bucket, 1).allowed).toBe(true);
  });
});

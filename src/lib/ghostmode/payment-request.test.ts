import { describe, expect, it } from "vitest";
import { validatePaymentRequest } from "./payment-request";
import type { AgentPaymentRequestV1 } from "./types";

const request: AgentPaymentRequestV1 = {
  version: "1",
  requestId: "0x11",
  network: "starknet",
  chainId: "SN_SEPOLIA",
  seller: "0x22",
  token: "0x33",
  amount: "100",
  expiresAt: 2_000,
  resource: "Premium AI Market Intelligence Report",
  nonce: "0x44",
  privacy: { sender: true, recipient: true, amount: true, token: true },
  receiptGate: "0x55",
  resourceCommitment: "0x66",
  authorization: { scheme: "stark-curve", r: "0x77", s: "0x88" },
};

describe("agent payment request", () => {
  it("accepts a bounded, unexpired v1 request", () => {
    expect(validatePaymentRequest(request, 1_000)).toEqual({ success: true, data: request });
  });

  it("rejects expired and malformed requests", () => {
    const expired = validatePaymentRequest({ ...request, expiresAt: 999 }, 1_000);
    expect(expired.success).toBe(false);
    const malformed = validatePaymentRequest({ ...request, seller: "hello", amount: "0" }, 1_000);
    expect(malformed.success).toBe(false);
    if (!malformed.success) expect(malformed.errors).toEqual(expect.arrayContaining([expect.stringMatching(/seller/), expect.stringMatching(/amount/)]));
  });
});

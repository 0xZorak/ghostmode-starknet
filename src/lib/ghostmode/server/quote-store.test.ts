import { describe, expect, it } from "vitest";
import type { PaymentQuote } from "../types";
import { beginQuoteVerification, findQuote, releaseQuote, saveQuote } from "./quote-store";

function quote(id: string): PaymentQuote {
  return {
    version: "ghostmode-x402/0.1",
    network: "sepolia",
    chainId: "SN_SEPOLIA",
    quoteId: id,
    resourceCommitment: "0x22",
    seller: "0x33",
    gate: "0x44",
    token: "0x55",
    amount: "100",
    validUntil: Math.floor(Date.now() / 1000) + 60,
    authorization: { scheme: "stark-curve", r: "0x66", s: "0x77" },
    resource: { name: "test", mediaType: "application/json", preview: "test" },
    proof: { type: "commitment", statement: "bytes" },
  };
}

describe("quote fulfillment state", () => {
  it("allows one verification and one release, then rejects replay", () => {
    const id = "0x710001";
    saveQuote({ quote: quote(id), resource: { paid: true }, createdAt: Date.now() });
    expect(beginQuoteVerification(id, "0x99").ok).toBe(true);
    expect(releaseQuote(id, "0x99", "0xaa")).toBe(true);
    expect(findQuote(id)?.status).toBe("released");
    expect(beginQuoteVerification(id, "0x99")).toMatchObject({ ok: false, reason: "already_used" });
  });

  it("rejects duplicate request IDs", () => {
    const id = "0x710002";
    const record = { quote: quote(id), resource: {}, createdAt: Date.now() };
    saveQuote(record);
    expect(() => saveQuote(record)).toThrow(/PAYMENT_ALREADY_EXISTS/);
  });
});

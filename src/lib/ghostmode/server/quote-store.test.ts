import { describe, expect, it } from "vitest";
import type { PaymentQuote } from "../types";
import { beginQuoteVerification, findQuote, releaseQuote, saveQuote } from "./quote-store";

function quote(id: string): PaymentQuote {
  return {
    version: "ghostmode-http402/0.2",
    network: "sepolia",
    chainId: "SN_SEPOLIA",
    quoteId: id,
    nonce: "0x99",
    termsCommitment: "0xaa",
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
  it("allows one verification and one release, then rejects replay", async () => {
    const id = "0x710001";
    await saveQuote({ quote: quote(id), resource: { paid: true }, createdAt: Date.now() });
    expect((await beginQuoteVerification(id, "0x99")).ok).toBe(true);
    expect(await releaseQuote(id, "0x99", "0xaa")).toBe(true);
    expect((await findQuote(id))?.status).toBe("released");
    expect(await beginQuoteVerification(id, "0x99")).toMatchObject({ ok: false, reason: "already_used" });
  });

  it("rejects duplicate request IDs", async () => {
    const id = "0x710002";
    const record = { quote: quote(id), resource: {}, createdAt: Date.now() };
    await saveQuote(record);
    await expect(saveQuote(record)).rejects.toThrow(/PAYMENT_ALREADY_EXISTS/);
  });

  it("does not allow one transaction hash to satisfy two quotes", async () => {
    const first = "0x710003";
    const second = "0x710004";
    await saveQuote({ quote: quote(first), resource: {}, createdAt: Date.now() });
    await saveQuote({ quote: quote(second), resource: {}, createdAt: Date.now() });
    expect((await beginQuoteVerification(first, "0x9911")).ok).toBe(true);
    expect(await beginQuoteVerification(second, "0x9911")).toMatchObject({ ok: false, reason: "transaction_reused" });
  });
});

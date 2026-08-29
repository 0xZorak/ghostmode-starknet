import { describe, expect, it } from "vitest";
import { buildPrivatePurchaseActions, buildPrivateTransferActions } from "./wallet-actions";
import type { PaymentQuote } from "./types";
import { computeQuoteId, computeQuoteTermsCommitment } from "./quote-integrity";

function quote(overrides: Partial<PaymentQuote> = {}): PaymentQuote {
  const base: PaymentQuote = {
    version: "ghostmode-http402/0.2",
    network: "sepolia",
    chainId: "SN_SEPOLIA",
    quoteId: "0x1",
    nonce: "0x99",
    termsCommitment: "0x1",
    resourceCommitment: "0x22",
    seller: "0x33",
    gate: "0x44",
    token: "0x55",
    amount: "100",
    validUntil: Math.floor(Date.now() / 1000) + 60,
    authorization: { scheme: "stark-curve", r: "0x66", s: "0x77" },
    resource: { name: "test", mediaType: "application/json", preview: "preview" },
    proof: { type: "commitment", statement: "hash" },
  };
  const termsCommitment = computeQuoteTermsCommitment(base);
  return { ...base, termsCommitment, quoteId: computeQuoteId(termsCommitment), ...overrides };
}

describe("wallet action builders", () => {
  it("creates one atomic transfer/invoke purchase route", () => {
    const actions = buildPrivatePurchaseActions(quote());
    expect(actions.map((action) => action.type)).toEqual(["transfer", "invoke"]);
    if (actions[1].type !== "invoke") throw new Error("expected invoke action");
    expect(actions[1]).toMatchObject({ contract: "0x44" });
    expect(actions[1].calldata).toEqual(["${poolAddress}", quote().quoteId, "0x22", expect.any(String), "0x66", "0x77"]);
  });

  it("rejects expired quotes and zero recipients", () => {
    expect(() => buildPrivatePurchaseActions(quote({ validUntil: 1 }))).toThrow(/expired/i);
    expect(() => buildPrivateTransferActions("0x55", 1n, "0x0")).toThrow(/Recipient/);
  });

  it("rejects altered seller, token, amount, network, gate, resource, or nonce", () => {
    for (const changed of [
      { seller: "0x34" }, { token: "0x56" }, { amount: "101" }, { chainId: "SN_MAIN" as const },
      { gate: "0x45" }, { resourceCommitment: "0x23" }, { nonce: "0x98" },
    ]) expect(() => buildPrivatePurchaseActions(quote(changed))).toThrow(/TAMPERED|INVALID/);
  });
});

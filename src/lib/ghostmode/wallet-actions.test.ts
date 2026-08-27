import { describe, expect, it } from "vitest";
import { buildPrivatePurchaseActions, buildPrivateTransferActions } from "./wallet-actions";
import type { PaymentQuote } from "./types";

function quote(overrides: Partial<PaymentQuote> = {}): PaymentQuote {
  return {
    version: "ghostmode-x402/0.1",
    network: "sepolia",
    chainId: "SN_SEPOLIA",
    quoteId: "0x11",
    resourceCommitment: "0x22",
    seller: "0x33",
    gate: "0x44",
    token: "0x55",
    amount: "100",
    validUntil: Math.floor(Date.now() / 1000) + 60,
    authorization: { scheme: "stark-curve", r: "0x66", s: "0x77" },
    resource: { name: "test", mediaType: "application/json", preview: "preview" },
    proof: { type: "commitment", statement: "hash" },
    ...overrides,
  };
}

describe("wallet action builders", () => {
  it("creates one atomic transfer/invoke purchase route", () => {
    const actions = buildPrivatePurchaseActions(quote());
    expect(actions.map((action) => action.type)).toEqual(["transfer", "invoke"]);
    if (actions[1].type !== "invoke") throw new Error("expected invoke action");
    expect(actions[1]).toMatchObject({ contract: "0x44" });
    expect(actions[1].calldata).toEqual(["${poolAddress}", "0x11", "0x22", expect.any(String), "0x66", "0x77"]);
  });

  it("rejects expired quotes and zero recipients", () => {
    expect(() => buildPrivatePurchaseActions(quote({ validUntil: 1 }))).toThrow(/expired/i);
    expect(() => buildPrivateTransferActions("0x55", 1n, "0x0")).toThrow(/Recipient/);
  });
});

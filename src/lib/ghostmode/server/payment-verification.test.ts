import { describe, expect, it } from "vitest";
import { hash } from "starknet";
import { verifyGateReceipt } from "./payment-verification";
import type { PaymentQuote } from "../types";

const quote: PaymentQuote = {
  version: "ghostmode-http402/0.2",
  network: "sepolia",
  chainId: "SN_SEPOLIA",
  quoteId: "0x11",
  nonce: "0x99",
  termsCommitment: "0xaa",
  resourceCommitment: "0x22",
  seller: "0x33",
  gate: "0x44",
  token: "0x55",
  amount: "100",
  validUntil: 9999999999,
  authorization: { scheme: "stark-curve", r: "0x66", s: "0x77" },
  resource: { name: "test", mediaType: "application/json", preview: "preview" },
  proof: { type: "commitment", statement: "hash" },
};

describe("x402 receipt verification", () => {
  it("accepts only the exact successful gate event", () => {
    const receipt = {
      execution_status: "SUCCEEDED",
      finality_status: "ACCEPTED_ON_L2",
      events: [{
        from_address: "0x44",
        keys: [hash.getSelectorFromName("ReceiptAccepted"), "0x11"],
        data: ["0x22"],
      }],
    };
    expect(verifyGateReceipt(receipt, quote).accepted).toBe(true);
    expect(verifyGateReceipt({ ...receipt, execution_status: "REVERTED" }, quote).accepted).toBe(false);
    expect(verifyGateReceipt({ ...receipt, events: [{ ...receipt.events[0], data: ["0x99"] }] }, quote).accepted).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { hash } from "starknet";
import { matchSellerPayment } from "./matching.mjs";

const selector = hash.getSelectorFromName("EncNoteCreated");
const receipt = { events: [{ from_address: "0x123", keys: [selector, "0xaa"], data: ["0x999"] }] };

describe("seller note matching", () => {
  it("matches only a seller note emitted by the exact transaction", () => {
    const result = matchSellerPayment({ notes: [{ id: 0xaan, amount: 100n }, { id: 0xbbn, amount: 100n }], receipt, poolAddress: "0x123", expectedAmount: 100n });
    expect(result.status).toBe("matched");
    expect(result.matches[0].id).toBe(0xaan);
  });

  it("rejects same-amount notes from another transaction and ambiguous exact outputs", () => {
    expect(matchSellerPayment({ notes: [{ id: 0xbbn, amount: 100n }], receipt, poolAddress: "0x123", expectedAmount: 100n }).status).toBe("not_found");
    const duplicated = { events: [...receipt.events, { from_address: "0x123", keys: [selector, "0xbb"], data: ["0x998"] }] };
    expect(matchSellerPayment({ notes: [{ id: 0xaan, amount: 100n }, { id: 0xbbn, amount: 100n }], receipt: duplicated, poolAddress: "0x123", expectedAmount: 100n }).status).toBe("ambiguous");
  });
});

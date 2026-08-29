import { describe, expect, it, vi } from "vitest";
import { computeQuoteId, computeQuoteTermsCommitment } from "./quote-integrity";
import { PrivateResearchAgent } from "./research-agent";
import type { PaymentQuote } from "./types";

function quote(): PaymentQuote {
  const base: PaymentQuote = {
    version: "ghostmode-http402/0.2", network: "sepolia", chainId: "SN_SEPOLIA", quoteId: "0x1", nonce: "0x77", termsCommitment: "0x1",
    resourceCommitment: "0x66", seller: "0x22", gate: "0x33", token: "0x11", amount: "100", validUntil: 4_000_000_000,
    authorization: { scheme: "stark-curve", r: "0x44", s: "0x55" }, resource: { name: "intel", mediaType: "application/json", preview: "intel" },
    proof: { type: "commitment", statement: "bytes" },
  };
  base.termsCommitment = computeQuoteTermsCommitment(base);
  base.quoteId = computeQuoteId(base.termsCommitment);
  return base;
}

const policy = { maxPerTransaction: "500", dailyBudget: "1000", requireApprovalAbove: "200", allowedTokens: ["0x11"], allowedSellers: ["0x22"], requirePrivateRoute: true };

describe("private research agent", () => {
  it("advances only through verified fulfillment stages", async () => {
    const executor = {
      pay: vi.fn().mockResolvedValue({ transactionHash: "0x99" }),
      unlock: vi.fn().mockResolvedValue({ paymentConfirmed: true, sellerVerified: true, receiptAuthorized: true, resourceReleased: true, resource: { report: true } }),
    };
    const agent = new PrivateResearchAgent([{ id: "intel", scoreGoal: () => 1, requestQuote: async () => quote() }], policy, executor);
    const result = await agent.run({ goal: "research threat activity", spentToday: "0", route: "STRK20_PRIVATE_INVOKE" });
    expect(result.states.at(-1)).toBe("RESOURCE_UNLOCKED");
    expect(result.resource).toEqual({ report: true });
  });

  it("refuses a public downgrade before calling the executor", async () => {
    const executor = { pay: vi.fn(), unlock: vi.fn() };
    const agent = new PrivateResearchAgent([{ id: "intel", scoreGoal: () => 1, requestQuote: async () => quote() }], policy, executor);
    const result = await agent.run({ goal: "research", spentToday: "0", route: "PUBLIC_STARKNET" });
    expect(result.states.at(-1)).toBe("POLICY_DENIED");
    expect(executor.pay).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import type { PaymentQuote } from "./types";
import { evaluateAgentSpend, type AgentSpendingPolicy } from "./agent-policy";

const quote = { token: "0x11", seller: "0x22", amount: "100" } as PaymentQuote;
const policy: AgentSpendingPolicy = {
  maxPerTransaction: "500",
  dailyBudget: "1000",
  requireApprovalAbove: "200",
  allowedTokens: ["0x11"],
  allowedSellers: ["0x22"],
  requirePrivateRoute: true,
};

describe("agent spending policy", () => {
  it("allows a private in-budget purchase without approval", () => {
    expect(evaluateAgentSpend(policy, quote, { spentToday: "100", route: "STRK20_PRIVATE_INVOKE" })).toMatchObject({ allowed: true, requiresApproval: false });
  });

  it("requires approval above the configured threshold", () => {
    expect(evaluateAgentSpend(policy, { ...quote, amount: "300" }, { spentToday: "0", route: "STRK20_PRIVATE_INVOKE" })).toMatchObject({ allowed: true, requiresApproval: true });
  });

  it("rejects public downgrade, untrusted seller/token, and budget excess", () => {
    const decision = evaluateAgentSpend(policy, { ...quote, seller: "0x33", token: "0x44", amount: "600" }, { spentToday: "700", route: "PUBLIC_STARKNET" });
    expect(decision.allowed).toBe(false);
    expect(decision.reasons).toEqual(expect.arrayContaining(["PER_TRANSACTION_LIMIT_EXCEEDED", "DAILY_BUDGET_EXCEEDED", "TOKEN_NOT_ALLOWED", "SELLER_NOT_ALLOWED", "PRIVATE_ROUTE_REQUIRED"]));
  });
});

import { num } from "starknet";
import type { PaymentQuote, PrivacyRoute } from "./types";

export type AgentSpendingPolicy = {
  maxPerTransaction: string;
  dailyBudget: string;
  requireApprovalAbove: string;
  allowedTokens: string[];
  allowedSellers: string[];
  requirePrivateRoute: boolean;
};

export type AgentSpendDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reasons: string[];
  remainingDailyBudget: string;
};

function sameFelt(left: string, right: string) {
  try { return num.toBigInt(left) === num.toBigInt(right); } catch { return false; }
}

export function evaluateAgentSpend(
  policy: AgentSpendingPolicy,
  quote: PaymentQuote,
  context: { spentToday: string; route: PrivacyRoute },
): AgentSpendDecision {
  const amount = BigInt(quote.amount);
  const spentToday = BigInt(context.spentToday);
  const maximum = BigInt(policy.maxPerTransaction);
  const budget = BigInt(policy.dailyBudget);
  const approval = BigInt(policy.requireApprovalAbove);
  const reasons: string[] = [];

  if (amount <= 0n) reasons.push("QUOTE_INVALID");
  if (amount > maximum) reasons.push("PER_TRANSACTION_LIMIT_EXCEEDED");
  if (spentToday + amount > budget) reasons.push("DAILY_BUDGET_EXCEEDED");
  if (!policy.allowedTokens.some((token) => sameFelt(token, quote.token))) reasons.push("TOKEN_NOT_ALLOWED");
  if (!policy.allowedSellers.some((seller) => sameFelt(seller, quote.seller))) reasons.push("SELLER_NOT_ALLOWED");
  if (policy.requirePrivateRoute && context.route !== "STRK20_PRIVATE_TRANSFER" && context.route !== "STRK20_PRIVATE_INVOKE") reasons.push("PRIVATE_ROUTE_REQUIRED");

  return {
    allowed: reasons.length === 0,
    requiresApproval: reasons.length === 0 && amount > approval,
    reasons,
    remainingDailyBudget: (budget > spentToday ? budget - spentToday : 0n).toString(),
  };
}

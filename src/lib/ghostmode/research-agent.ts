import { assertQuoteIntegrity } from "./quote-integrity";
import { evaluateAgentSpend, type AgentSpendingPolicy } from "./agent-policy";
import type { PaymentQuote, PrivacyRoute } from "./types";

export type ResearchAgentState =
  | "GOAL_RECEIVED" | "SERVICE_SELECTED" | "QUOTE_CREATED" | "QUOTE_SIGNED" | "QUOTE_ACCEPTED"
  | "APPROVAL_REQUIRED" | "PAYMENT_PREPARING" | "PAYMENT_SUBMITTED" | "PAYMENT_CONFIRMED"
  | "SELLER_VERIFIED" | "RECEIPT_AUTHORIZED" | "RESOURCE_UNLOCKED" | "POLICY_DENIED";

export type ResearchService = {
  id: string;
  scoreGoal(goal: string): number;
  requestQuote(): Promise<PaymentQuote>;
};

export type AgentPaymentExecutor = {
  pay(quote: PaymentQuote): Promise<{ transactionHash: string }>;
  unlock(quote: PaymentQuote, transactionHash: string): Promise<{
    paymentConfirmed: boolean;
    sellerVerified: boolean;
    receiptAuthorized: boolean;
    resourceReleased: boolean;
    resource?: unknown;
  }>;
};

export type ResearchRun = {
  states: ResearchAgentState[];
  serviceId?: string;
  quoteId?: string;
  transactionHash?: string;
  resource?: unknown;
  denialReasons?: string[];
};

export class PrivateResearchAgent {
  constructor(
    private readonly services: ResearchService[],
    private readonly policy: AgentSpendingPolicy,
    private readonly executor: AgentPaymentExecutor,
  ) {}

  async run(input: {
    goal: string;
    spentToday: string;
    route: PrivacyRoute;
    approve?: (quote: PaymentQuote) => Promise<boolean>;
  }): Promise<ResearchRun> {
    const states: ResearchAgentState[] = ["GOAL_RECEIVED"];
    const service = this.services
      .map((candidate) => ({ candidate, score: candidate.scoreGoal(input.goal) }))
      .filter(({ score }) => Number.isFinite(score) && score > 0)
      .sort((left, right) => right.score - left.score)[0]?.candidate;
    if (!service) return { states: [...states, "POLICY_DENIED"], denialReasons: ["NO_ALLOWED_SERVICE"] };
    states.push("SERVICE_SELECTED");

    const quote = assertQuoteIntegrity(await service.requestQuote());
    states.push("QUOTE_CREATED", "QUOTE_SIGNED", "QUOTE_ACCEPTED");
    const decision = evaluateAgentSpend(this.policy, quote, { spentToday: input.spentToday, route: input.route });
    if (!decision.allowed) return { states: [...states, "POLICY_DENIED"], serviceId: service.id, quoteId: quote.quoteId, denialReasons: decision.reasons };
    if (decision.requiresApproval) {
      states.push("APPROVAL_REQUIRED");
      if (!input.approve || !await input.approve(quote)) return { states, serviceId: service.id, quoteId: quote.quoteId, denialReasons: ["HUMAN_APPROVAL_REQUIRED"] };
    }

    states.push("PAYMENT_PREPARING");
    const payment = await this.executor.pay(quote);
    if (!payment.transactionHash) throw new Error("TRANSACTION_STATUS_UNKNOWN");
    states.push("PAYMENT_SUBMITTED");
    const fulfillment = await this.executor.unlock(quote, payment.transactionHash);
    if (!fulfillment.paymentConfirmed) throw new Error("PAYMENT_NOT_FOUND");
    states.push("PAYMENT_CONFIRMED");
    if (!fulfillment.sellerVerified) throw new Error("SELLER_VERIFIER_UNAVAILABLE");
    states.push("SELLER_VERIFIED");
    if (!fulfillment.receiptAuthorized) throw new Error("RECEIPT_INVALID");
    states.push("RECEIPT_AUTHORIZED");
    if (!fulfillment.resourceReleased) throw new Error("RESOURCE_ALREADY_CLAIMED");
    states.push("RESOURCE_UNLOCKED");
    return { states, serviceId: service.id, quoteId: quote.quoteId, transactionHash: payment.transactionHash, resource: fulfillment.resource };
  }
}

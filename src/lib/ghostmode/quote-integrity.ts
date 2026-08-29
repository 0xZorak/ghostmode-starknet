import { constants, hash, num } from "starknet";
import type { AgentPaymentRequestV1, PaymentQuote } from "./types";

type QuoteTerms = Pick<PaymentQuote, "chainId" | "seller" | "gate" | "token" | "amount" | "resourceCommitment" | "nonce">;

function chainFelt(chainId: QuoteTerms["chainId"]) {
  return chainId === "SN_MAIN" ? constants.StarknetChainId.SN_MAIN : constants.StarknetChainId.SN_SEPOLIA;
}

export function computeQuoteTermsCommitment(terms: QuoteTerms) {
  return num.toHex(hash.computePoseidonHashOnElements([
    chainFelt(terms.chainId),
    terms.seller,
    terms.gate,
    terms.token,
    terms.amount,
    terms.resourceCommitment,
    terms.nonce,
  ]));
}

export function computeQuoteId(termsCommitment: string) {
  return num.toHex(hash.computePoseidonHashOnElements([termsCommitment]));
}

export function assertQuoteIntegrity(quote: PaymentQuote) {
  const commitment = computeQuoteTermsCommitment(quote);
  if (num.toBigInt(commitment) !== num.toBigInt(quote.termsCommitment)) throw new Error("QUOTE_TERMS_TAMPERED");
  if (num.toBigInt(computeQuoteId(commitment)) !== num.toBigInt(quote.quoteId)) throw new Error("QUOTE_ID_INVALID");
  return quote;
}

export function assertRequestIntegrity(request: AgentPaymentRequestV1) {
  const termsCommitment = computeQuoteTermsCommitment({
    chainId: request.chainId,
    seller: request.seller,
    gate: request.receiptGate,
    token: request.token,
    amount: request.amount,
    resourceCommitment: request.resourceCommitment,
    nonce: request.nonce,
  });
  if (num.toBigInt(computeQuoteId(termsCommitment)) !== num.toBigInt(request.requestId)) throw new Error("QUOTE_ID_INVALID");
  return termsCommitment;
}

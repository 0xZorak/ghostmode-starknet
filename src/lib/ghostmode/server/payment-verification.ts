import { hash, num } from "starknet";
import type { PaymentQuote } from "../types";

const RECEIPT_ACCEPTED = hash.getSelectorFromName("ReceiptAccepted");

type StarknetEvent = {
  from_address?: string;
  keys?: string[];
  data?: string[];
};

type TransactionReceipt = {
  execution_status?: string;
  finality_status?: string;
  events?: StarknetEvent[];
};

function sameFelt(left: string | undefined, right: string) {
  if (!left) return false;
  try {
    return num.toBigInt(left) === num.toBigInt(right);
  } catch {
    return false;
  }
}

export function verifyGateReceipt(receipt: unknown, quote: PaymentQuote) {
  const candidate = receipt as TransactionReceipt;
  const accepted = candidate.execution_status === "SUCCEEDED"
    && Array.isArray(candidate.events)
    && candidate.events.some((event) => sameFelt(event.from_address, quote.gate)
      && sameFelt(event.keys?.[0], RECEIPT_ACCEPTED)
      && sameFelt(event.keys?.[1], quote.quoteId)
      && sameFelt(event.data?.[0], quote.resourceCommitment));

  return {
    accepted,
    executionStatus: candidate.execution_status ?? "UNKNOWN",
    finalityStatus: candidate.finality_status ?? "UNKNOWN",
  };
}

export type SellerVerification = {
  verified: boolean;
  noteId?: string;
  reason?: string;
};

export async function verifySellerNote(quote: PaymentQuote, transactionHash: string): Promise<SellerVerification> {
  const endpoint = process.env.GHOSTMODE_SELLER_VERIFIER_URL;
  const token = process.env.GHOSTMODE_SELLER_VERIFIER_TOKEN;
  if (!endpoint || !token) {
    return { verified: false, reason: "seller_verifier_not_configured" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quoteId: quote.quoteId,
      transactionHash,
      seller: quote.seller,
      token: quote.token,
      amount: quote.amount,
      network: quote.network,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return { verified: false, reason: `seller_verifier_http_${response.status}` };

  const result = await response.json() as SellerVerification;
  if (result.verified !== true || typeof result.noteId !== "string" || result.noteId.length === 0) {
    return { verified: false, reason: result.reason ?? "seller_note_not_found" };
  }
  return { verified: true, noteId: result.noteId };
}

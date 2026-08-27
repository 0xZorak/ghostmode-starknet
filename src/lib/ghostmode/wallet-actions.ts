import type { WALLET_API } from "@starknet-io/types-js";
import { num } from "starknet";
import type { PaymentQuote } from "./types";

const FELT_ZERO = 0n;

function requiredFelt(value: string, field: string): string {
  const parsed = num.toBigInt(value);
  if (parsed === FELT_ZERO) throw new Error(`${field} is not configured.`);
  return num.toHex(parsed);
}

export function buildPrivateTransferActions(token: string, amount: bigint, recipient: string): WALLET_API.STRK20_ACTION[] {
  if (amount <= FELT_ZERO) throw new Error("Transfer amount must be greater than zero.");
  return [{
    type: "transfer",
    token: requiredFelt(token, "Token"),
    amount: num.toHex(amount),
    recipient: requiredFelt(recipient, "Recipient"),
  }];
}

export function buildPrivatePurchaseActions(
  quote: PaymentQuote,
): WALLET_API.STRK20_ACTION[] {
  const expectedChainId = quote.network === "mainnet" ? "SN_MAIN" : "SN_SEPOLIA";
  if (quote.chainId !== expectedChainId) throw new Error("Quote network metadata is inconsistent.");
  const seller = requiredFelt(quote.seller, "Seller address");
  const gate = requiredFelt(quote.gate, "ReceiptGate address");
  const token = requiredFelt(quote.token, "Payment token");
  const amount = num.toBigInt(quote.amount);

  if (amount <= FELT_ZERO) throw new Error("Payment amount must be greater than zero.");
  if (quote.validUntil * 1000 <= Date.now()) throw new Error("This quote has expired. Request a new quote.");

  return [
    {
      type: "transfer",
      token,
      amount: num.toHex(amount),
      recipient: seller,
    },
    {
      type: "invoke",
      contract: gate,
      calldata: [
        "${poolAddress}",
        requiredFelt(quote.quoteId, "Quote ID"),
        requiredFelt(quote.resourceCommitment, "Resource commitment"),
        num.toHex(quote.validUntil),
        requiredFelt(quote.authorization.r, "Seller authorization r"),
        requiredFelt(quote.authorization.s, "Seller authorization s"),
      ],
    },
  ];
}

export function buildShieldActions(token: string, amount: bigint): WALLET_API.STRK20_ACTION[] {
  if (amount <= FELT_ZERO) throw new Error("Shield amount must be greater than zero.");
  return [{ type: "deposit", token: requiredFelt(token, "Token"), amount: num.toHex(amount) }];
}

import type { AgentAction, PrivacyPlan } from "./types";
import { evaluatePrivacy } from "./privacy-engine";
import { calculatePrivacyScore } from "./privacy-score";

export function planAgentAction(action: AgentAction): PrivacyPlan {
  const isPurchase = action.kind === "purchase";
  const evaluation = evaluatePrivacy({
    action: action.kind === "purchase" ? "payment" : action.kind,
    network: "starknet-sepolia",
    token: action.token,
    amount: action.amount,
    recipient: action.recipient,
    requirements: { hideSender: true, hideRecipient: true, hideAmount: true, hideToken: true },
    capabilities: { privacyWallet: true, privateInvoke: true, recipientRegistered: true },
  });

  return {
    risk: "high",
    route: isPurchase ? "strk20-private-invoke" : "strk20-private-transfer",
    summary: isPurchase
      ? "Route the payment inside STRK20 and bind the same pool transaction to an opaque purchase receipt."
      : "Keep the value movement inside the STRK20 pool instead of publishing a direct account transfer.",
    findings: [
      {
        field: "Agent owner",
        publicRoute: "public",
        ghostRoute: "private",
        note: "The shield edge remains public, but the later in-pool action is not attributed to the owner.",
      },
      {
        field: "Vendor relationship",
        publicRoute: "public",
        ghostRoute: "private",
        note: "The private note does not publish the sender-to-recipient relationship.",
      },
      {
        field: "Token and amount",
        publicRoute: "public",
        ghostRoute: "private",
        note: "A normal encrypted note hides token and amount; this flow does not use an open note.",
      },
      {
        field: "HTTP request",
        publicRoute: "counterparty",
        ghostRoute: "counterparty",
        note: "The seller can still see the request unless a relay or OHTTP layer is added.",
      },
    ],
    stillPublic: [
      "The original shielding address, token and amount",
      "Pool transaction timing and an unlinkable nullifier",
      "An opaque ReceiptGate event containing the invoice commitment",
      "The request and network metadata visible to the seller",
    ],
    requirements: [
      "Privacy-enabled Starknet wallet on the quote network",
      "Seller registered with the STRK20 pool",
      "A channel and token subchannel ready for the seller",
      "ReceiptGate deployed and configured with the target STRK20 pool",
    ],
    score: calculatePrivacyScore(evaluation),
  };
}

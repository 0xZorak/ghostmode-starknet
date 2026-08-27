import { num } from "starknet";
import type { ExposureLevel, PrivacyEvaluation, PrivacyIntent, PrivacyProperty } from "./types";

const PRIVATE_PROPERTIES: Array<[keyof PrivacyIntent["requirements"], PrivacyProperty]> = [
  ["hideSender", "sender"],
  ["hideRecipient", "recipient"],
  ["hideAmount", "amount"],
  ["hideToken", "token"],
];

function isPositiveFelt(value: string) {
  try {
    return num.toBigInt(value) > 0n;
  } catch {
    return false;
  }
}

function unsupported(intent: PrivacyIntent | undefined, reason: string, errorCode: PrivacyEvaluation["errorCode"]): PrivacyEvaluation {
  return {
    supported: false,
    route: "UNSUPPORTED",
    privacy: { sender: "public", recipient: "public", amount: "public", token: "public" },
    publicLeakage: ["No transaction was prepared or submitted."],
    warnings: [],
    reasons: {
      sender: "No private route was selected.",
      recipient: "No private route was selected.",
      amount: "No private route was selected.",
      token: "No private route was selected.",
      timing: "No transaction was submitted.",
      entryExit: "Shield and unshield edges are not part of this evaluation.",
    },
    reason,
    errorCode,
    alternatives: intent?.capabilities?.privacyWallet === false
      ? ["Connect a wallet that implements the STRK20 Wallet API.", "Run a privacy evaluation again after switching to the requested network."]
      : ["Change the requested privacy requirements.", "Use a supported STRK20 private transfer or one-invoke adapter."],
  };
}

/**
 * Evaluates enforceable privacy properties. It never substitutes public execution
 * when any requested property requires a private route.
 */
export function evaluatePrivacy(intent: PrivacyIntent): PrivacyEvaluation {
  if (!intent || !isPositiveFelt(intent.token) || !isPositiveFelt(intent.amount)) {
    return unsupported(intent, "Token and amount must be valid positive Starknet felts.", "INVALID_INTENT");
  }

  const wantsPrivacy = PRIVATE_PROPERTIES.some(([requirement]) => intent.requirements[requirement]);
  if (!wantsPrivacy) {
    return {
      supported: true,
      route: "PUBLIC_STARKNET",
      privacy: { sender: "public", recipient: "public", amount: "public", token: "public" },
      publicLeakage: ["Sender, recipient, token, amount, calldata, and timing are public on Starknet."],
      warnings: ["This route is public because no confidentiality property was requested."],
      reasons: {
        sender: "A public account signs the transaction.",
        recipient: "The destination is in public calldata.",
        amount: "The amount is in public calldata.",
        token: "The token contract is public.",
        timing: "Block inclusion time is public.",
        entryExit: "No STRK20 private balance is used.",
      },
      alternatives: ["Request one or more confidentiality properties to require STRK20."],
    };
  }

  if (intent.capabilities?.privacyWallet === false) {
    return unsupported(intent, "The connected wallet does not expose the STRK20 Privacy Wallet API.", "PRIVATE_ROUTE_UNAVAILABLE");
  }
  if ((intent.action === "payment" || intent.action === "transfer") && intent.capabilities?.recipientRegistered === false) {
    return unsupported(intent, "The recipient is not registered for STRK20 private transfers.", "PRIVATE_ROUTE_UNAVAILABLE");
  }

  const transfer = intent.action === "payment" || intent.action === "transfer";
  const invoke = intent.action === "contract-invoke" || intent.action === "swap";
  if (!transfer && !invoke) return unsupported(intent, "This action has no reviewed GhostMode route.", "UNSUPPORTED_ACTION");
  if (invoke && intent.capabilities?.privateInvoke === false) {
    return unsupported(intent, "The action requires a reviewed STRK20 private-invoke adapter, but none is available.", "PRIVATE_ROUTE_UNAVAILABLE");
  }

  const actual: Record<PrivacyProperty, ExposureLevel> = transfer
    ? { sender: "private", recipient: "private", amount: "private", token: "private" }
    : { sender: "private", recipient: "public", amount: "counterparty", token: "counterparty" };
  const unmet = PRIVATE_PROPERTIES
    .filter(([requirement, property]) => intent.requirements[requirement] && actual[property] !== "private")
    .map(([, property]) => property);
  if (unmet.length) {
    return unsupported(
      intent,
      `The reviewed route cannot keep these requested properties private: ${unmet.join(", ")}. STRK20 private invokes expose the invoked contract and calldata, and open notes expose token and amount.`,
      "PRIVATE_ROUTE_UNAVAILABLE",
    );
  }

  return {
    supported: true,
    route: transfer ? "STRK20_PRIVATE_TRANSFER" : "STRK20_PRIVATE_INVOKE",
    privacy: actual,
    publicLeakage: [
      "Use of the STRK20 privacy system and transaction timing are observable.",
      "The original shield deposit and a later unshield withdrawal are public and may be correlated by timing or amount.",
      ...(invoke ? ["The invoked helper contract and its calldata are public."] : []),
    ],
    warnings: invoke ? ["Private invoke protects pool notes, not arbitrary contract calldata or state."] : [],
    reasons: {
      sender: "The spend consumes private notes and publishes a nullifier, not the owner's account address.",
      recipient: transfer ? "The recipient is encoded in the encrypted note." : "The invoked contract is public on Starknet.",
      amount: transfer ? "The amount is encoded in the encrypted note." : "Open-note amounts and invoke calldata can be public.",
      token: transfer ? "The token is encoded in the encrypted note." : "Open-note tokens and invoked contracts can reveal the asset.",
      timing: "A Starknet block timestamp and transaction order remain public.",
      entryExit: "Deposits and withdrawals cross the public/private boundary and remain visible.",
    },
    alternatives: [],
  };
}

export async function executePrivateIntent(
  intent: PrivacyIntent,
  executor: (evaluation: PrivacyEvaluation) => Promise<unknown>,
) {
  const evaluation = evaluatePrivacy(intent);
  if (!evaluation.supported || evaluation.route === "PUBLIC_STARKNET") {
    const error = new Error(evaluation.reason ?? "A private route is unavailable.");
    error.name = evaluation.errorCode ?? "PRIVATE_ROUTE_UNAVAILABLE";
    throw error;
  }
  return executor(evaluation);
}

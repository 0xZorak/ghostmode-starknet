import { constants, num } from "starknet";
import type { AgentPaymentRequestV1 } from "./types";
import { assertRequestIntegrity } from "./quote-integrity";

function validFelt(value: unknown, allowZero = false): value is string {
  if (typeof value !== "string") return false;
  try {
    const felt = num.toBigInt(value);
    return felt < constants.PRIME && (allowZero ? felt >= 0n : felt > 0n);
  } catch {
    return false;
  }
}

export type PaymentRequestValidation =
  | { success: true; data: AgentPaymentRequestV1 }
  | { success: false; errors: string[] };

export function validatePaymentRequest(value: unknown, nowSeconds = Math.floor(Date.now() / 1000)): PaymentRequestValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { success: false, errors: ["request must be an object"] };
  const request = value as Partial<AgentPaymentRequestV1>;
  const errors: string[] = [];
  if (request.version !== "1") errors.push("version must be 1");
  if (request.network !== "starknet") errors.push("network must be starknet");
  if (request.chainId !== "SN_SEPOLIA" && request.chainId !== "SN_MAIN") errors.push("unsupported chainId");
  for (const field of ["requestId", "seller", "token", "receiptGate", "resourceCommitment"] as const) {
    if (!validFelt(request[field])) errors.push(`${field} must be a non-zero Starknet felt`);
  }
  if (!validFelt(request.nonce)) errors.push("nonce must be a non-zero Starknet felt");
  if (!validFelt(request.amount)) errors.push("amount must be a positive integer in token base units");
  if (!Number.isSafeInteger(request.expiresAt)) errors.push("expiresAt must be an integer Unix timestamp");
  else if ((request.expiresAt as number) <= nowSeconds) errors.push("payment request has expired");
  else if ((request.expiresAt as number) > nowSeconds + 24 * 60 * 60) errors.push("expiresAt may not be more than 24 hours ahead");
  if (typeof request.resource !== "string" || request.resource.length < 1 || request.resource.length > 512) errors.push("resource must be 1-512 characters");
  const privacy = request.privacy;
  if (!privacy || [privacy.sender, privacy.recipient, privacy.amount, privacy.token].some((item) => typeof item !== "boolean")) {
    errors.push("privacy must contain boolean sender, recipient, amount, and token fields");
  }
  if (request.authorization?.scheme !== "stark-curve"
    || !validFelt(request.authorization.r)
    || !validFelt(request.authorization.s)) {
    errors.push("authorization must contain a non-zero Stark-curve r/s signature");
  }
  if (errors.length === 0) {
    try { assertRequestIntegrity(request as AgentPaymentRequestV1); } catch { errors.push("requestId does not commit to the payment terms"); }
  }
  return errors.length ? { success: false, errors } : { success: true, data: request as AgentPaymentRequestV1 };
}

export function assertPaymentRequest(value: unknown, nowSeconds?: number): AgentPaymentRequestV1 {
  const result = validatePaymentRequest(value, nowSeconds);
  if (!result.success) throw new Error(`INVALID_PAYMENT_REQUEST: ${result.errors.join("; ")}`);
  return result.data;
}

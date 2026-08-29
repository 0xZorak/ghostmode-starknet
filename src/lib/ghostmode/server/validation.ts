import { constants, num } from "starknet";
import { z } from "zod";

export const feltSchema = z.string().refine((value) => {
  try {
    const parsed = num.toBigInt(value);
    return parsed > 0n && parsed < constants.PRIME;
  } catch {
    return false;
  }
}, "must be a non-zero Starknet felt");

export const unlockRequestSchema = z.object({
  quoteId: feltSchema.optional(),
  requestId: feltSchema.optional(),
  transactionHash: feltSchema,
}).strict().refine((value) => Boolean(value.quoteId || value.requestId), "quoteId or requestId is required");

export const privacyIntentSchema = z.object({
  action: z.enum(["payment", "transfer", "contract-invoke", "swap"]),
  network: z.enum(["starknet-sepolia", "starknet-mainnet"]),
  token: feltSchema,
  amount: z.string().refine((value) => {
    try { return BigInt(value) > 0n; } catch { return false; }
  }, "must be a positive base-unit integer"),
  recipient: feltSchema.optional(),
  requirements: z.object({
    hideSender: z.boolean(), hideRecipient: z.boolean(), hideAmount: z.boolean(), hideToken: z.boolean(),
  }).strict(),
  capabilities: z.object({
    privacyWallet: z.boolean(), privateInvoke: z.boolean(), recipientRegistered: z.boolean().optional(),
  }).strict().optional(),
}).strict();

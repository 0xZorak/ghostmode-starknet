import { describe, expect, it } from "vitest";
import { privacyIntentSchema, unlockRequestSchema } from "./validation";

describe("server boundary validation", () => {
  it("accepts an exact unlock claim and rejects unknown or malformed fields", () => {
    expect(unlockRequestSchema.safeParse({ requestId: "0x1", transactionHash: "0x2" }).success).toBe(true);
    expect(unlockRequestSchema.safeParse({ transactionHash: "0x2" }).success).toBe(false);
    expect(unlockRequestSchema.safeParse({ requestId: "0x1", transactionHash: "nope" }).success).toBe(false);
    expect(unlockRequestSchema.safeParse({ requestId: "0x1", transactionHash: "0x2", admin: true }).success).toBe(false);
  });

  it("fails closed on invalid privacy intent values", () => {
    const valid = {
      action: "payment",
      network: "starknet-sepolia",
      token: "0x1",
      amount: "1",
      requirements: { hideSender: true, hideRecipient: true, hideAmount: true, hideToken: true },
      capabilities: { privacyWallet: true, privateInvoke: true },
    };
    expect(privacyIntentSchema.safeParse(valid).success).toBe(true);
    expect(privacyIntentSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(privacyIntentSchema.safeParse({ ...valid, network: "ethereum" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { evaluatePrivacy, executePrivateIntent } from "./privacy-engine";
import { calculatePrivacyScore } from "./privacy-score";
import type { PrivacyIntent } from "./types";

const privatePayment: PrivacyIntent = {
  action: "payment",
  network: "starknet-sepolia",
  token: "0x4718",
  amount: "100",
  recipient: "0x123",
  requirements: { hideSender: true, hideRecipient: true, hideAmount: true, hideToken: true },
  capabilities: { privacyWallet: true, privateInvoke: true, recipientRegistered: true },
};

describe("privacy policy engine", () => {
  it("selects a real STRK20 private transfer and explains its leakage", () => {
    const result = evaluatePrivacy(privatePayment);
    expect(result.supported).toBe(true);
    expect(result.route).toBe("STRK20_PRIVATE_TRANSFER");
    expect(result.privacy).toEqual({ sender: "private", recipient: "private", amount: "private", token: "private" });
    expect(result.publicLeakage.join(" ")).toMatch(/timing/i);
    expect(calculatePrivacyScore(result).score).toBe(80);
  });

  it("refuses private execution without a privacy wallet", async () => {
    const intent = { ...privatePayment, capabilities: { ...privatePayment.capabilities!, privacyWallet: false } };
    const result = evaluatePrivacy(intent);
    expect(result).toMatchObject({ supported: false, route: "UNSUPPORTED", errorCode: "PRIVATE_ROUTE_UNAVAILABLE" });
    await expect(executePrivateIntent(intent, async () => "submitted")).rejects.toMatchObject({ name: "PRIVATE_ROUTE_UNAVAILABLE" });
  });

  it("never calls a public contract invoke fully private", () => {
    const result = evaluatePrivacy({ ...privatePayment, action: "contract-invoke" });
    expect(result.supported).toBe(false);
    expect(result.reason).toMatch(/calldata/i);
  });

  it("allows an explicitly public route only when privacy was not requested", () => {
    const result = evaluatePrivacy({
      ...privatePayment,
      requirements: { hideSender: false, hideRecipient: false, hideAmount: false, hideToken: false },
    });
    expect(result).toMatchObject({ supported: true, route: "PUBLIC_STARKNET" });
  });
});

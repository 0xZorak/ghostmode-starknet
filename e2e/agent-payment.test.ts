import { describe, expect, it, vi } from "vitest";
import type { WalletAccountV6 } from "starknet";
import { GhostMode } from "../src/lib/ghostmode/sdk";
import type { AgentPaymentRequestV1 } from "../src/lib/ghostmode/types";
import { computeQuoteId, computeQuoteTermsCommitment } from "../src/lib/ghostmode/quote-integrity";

function request(overrides: Partial<AgentPaymentRequestV1> = {}): AgentPaymentRequestV1 {
  const value: AgentPaymentRequestV1 = {
    version: "1",
    requestId: "0x11",
    network: "starknet",
    chainId: "SN_SEPOLIA",
    seller: "0x22",
    token: "0x33",
    amount: "100",
    expiresAt: Math.floor(Date.now() / 1000) + 300,
    resource: "Premium AI Market Intelligence Report",
    nonce: "0x44",
    privacy: { sender: true, recipient: true, amount: true, token: true },
    receiptGate: "0x55",
    resourceCommitment: "0x66",
    authorization: { scheme: "stark-curve", r: "0x77", s: "0x88" },
    ...overrides,
  };
  value.requestId = computeQuoteId(computeQuoteTermsCommitment({
    chainId: value.chainId,
    seller: value.seller,
    gate: value.receiptGate,
    token: value.token,
    amount: value.amount,
    resourceCommitment: value.resourceCommitment,
    nonce: value.nonce,
  }));
  return value;
}

describe("agent payment integration", () => {
  it("simulates before it submits the exact atomic private action pair", async () => {
    const prepare = vi.fn().mockResolvedValue({});
    const submit = vi.fn().mockResolvedValue({ transaction_hash: "0xabc" });
    const wallet = { strk20PrepareInvoke: prepare, strk20InvokeTransaction: submit } as unknown as WalletAccountV6;
    const ghost = new GhostMode({ network: "sepolia", wallet });
    await expect(ghost.pay(request())).resolves.toEqual({ transaction_hash: "0xabc" });
    expect(prepare).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
    expect(prepare.mock.calls[0][0].map((action: { type: string }) => action.type)).toEqual(["transfer", "invoke"]);
    expect(prepare.mock.calls[0][1]).toBe(true);
  });

  it("fails safely when the wallet is absent, wrong, or the request expired", async () => {
    const noWallet = new GhostMode({ network: "sepolia" });
    await expect(noWallet.pay(request())).rejects.toThrow(/WALLET_NOT_PRIVACY_CAPABLE/);

    const wrongNetwork = new GhostMode({ network: "mainnet", wallet: {} as WalletAccountV6 });
    await expect(wrongNetwork.pay(request())).rejects.toThrow(/WRONG_NETWORK/);

    await expect(noWallet.pay(request({ expiresAt: 1 }))).rejects.toThrow(/expired/i);
  });

  it("uses the status and verification API without exposing wallet keys", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "verified" }) });
    const ghost = new GhostMode({ network: "sepolia", apiBaseUrl: "https://seller.example", fetcher: fetcher as unknown as typeof fetch });
    await expect(ghost.verify("0x11", "0x99")).resolves.toEqual({ status: "verified" });
    await ghost.getPaymentStatus("0x11");
    expect(fetcher.mock.calls[0][0]).toBe("https://seller.example/api/payment/verify");
    expect(fetcher.mock.calls[1][0]).toBe("https://seller.example/api/payment/0x11");
  });
});

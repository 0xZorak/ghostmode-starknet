import type { WalletAccountV6 } from "starknet";
import { evaluatePrivacy } from "./privacy-engine";
import { assertPaymentRequest } from "./payment-request";
import type { AgentPaymentRequestV1, PaymentQuote, PrivacyIntent } from "./types";
import { buildPrivatePurchaseActions } from "./wallet-actions";

export type GhostModeOptions = {
  network: "sepolia" | "mainnet";
  wallet?: WalletAccountV6;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
};

/** Minimal, wallet-keyless SDK for AI agents and browser applications. */
export class GhostMode {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: GhostModeOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  evaluate(intent: PrivacyIntent) {
    const expected = this.options.network === "mainnet" ? "starknet-mainnet" : "starknet-sepolia";
    if (intent.network !== expected) {
      const evaluation = evaluatePrivacy({
        ...intent,
        capabilities: { privacyWallet: false, privateInvoke: false, recipientRegistered: false },
      });
      return {
        ...evaluation,
        reason: `WRONG_NETWORK: SDK is configured for ${expected}, but the intent targets ${intent.network}.`,
        alternatives: [`Create a GhostMode instance for ${intent.network} or switch the intent network.`],
      };
    }
    return evaluatePrivacy(intent);
  }

  async pay(input: AgentPaymentRequestV1) {
    const request = assertPaymentRequest(input);
    const expectedChain = this.options.network === "mainnet" ? "SN_MAIN" : "SN_SEPOLIA";
    if (request.chainId !== expectedChain) throw new Error("WRONG_NETWORK: payment request does not match the configured SDK network.");
    if (!this.options.wallet) throw new Error("WALLET_NOT_PRIVACY_CAPABLE: attach a WalletAccountV6 before calling pay().");

    const quote: PaymentQuote = {
      version: "ghostmode-x402/0.1",
      network: this.options.network,
      chainId: request.chainId,
      quoteId: request.requestId,
      resourceCommitment: request.resourceCommitment,
      seller: request.seller,
      gate: request.receiptGate,
      token: request.token,
      amount: request.amount,
      validUntil: request.expiresAt,
      authorization: request.authorization,
      resource: { name: request.resource, mediaType: "application/octet-stream", preview: request.resource },
      proof: { type: "commitment", statement: "Resource bytes must match resourceCommitment." },
    };
    const actions = buildPrivatePurchaseActions(quote);
    await this.options.wallet.strk20PrepareInvoke(actions, true);
    return this.options.wallet.strk20InvokeTransaction(actions);
  }

  async verify(requestId: string, transactionHash: string) {
    return this.request("/api/payment/verify", { method: "POST", body: JSON.stringify({ requestId, transactionHash }) });
  }

  async getPaymentStatus(requestId: string) {
    return this.request(`/api/payment/${encodeURIComponent(requestId)}`);
  }

  private async request(path: string, init?: RequestInit) {
    const response = await this.fetcher(`${this.options.apiBaseUrl ?? ""}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error ?? `GhostMode API returned HTTP ${response.status}.`);
    return payload;
  }
}

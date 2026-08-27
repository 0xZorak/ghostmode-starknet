import type { WalletAccountV6 } from "starknet";
import type { WALLET_API } from "@starknet-io/types-js";
import { analyzeCompatibility } from "./compatibility";
import { buildPrivatePurchaseActions, buildPrivateTransferActions, buildShieldActions } from "./wallet-actions";
import type { CompatibilityInput, PaymentQuote } from "./types";

/**
 * Reusable STRK20 execution surface for GhostMode-compatible applications.
 * Viewing keys and private notes stay inside the user's wallet.
 */
export class GhostModeClient {
  constructor(private readonly wallet: WalletAccountV6) {}

  analyze(input: CompatibilityInput) {
    return analyzeCompatibility(input);
  }

  purchaseActions(quote: PaymentQuote): WALLET_API.STRK20_ACTION[] {
    return buildPrivatePurchaseActions(quote);
  }

  transferActions(token: string, amount: bigint, recipient: string): WALLET_API.STRK20_ACTION[] {
    return buildPrivateTransferActions(token, amount, recipient);
  }

  shield(token: string, amount: bigint) {
    return this.wallet.strk20InvokeTransaction(buildShieldActions(token, amount));
  }

  balances(tokens: string[] = []) {
    return this.wallet.strk20Balances(tokens);
  }

  simulate(actions: WALLET_API.STRK20_ACTION[]) {
    return this.wallet.strk20PrepareInvoke(actions, true);
  }

  submit(actions: WALLET_API.STRK20_ACTION[]) {
    return this.wallet.strk20InvokeTransaction(actions);
  }

  async executePurchase(quote: PaymentQuote) {
    const actions = this.purchaseActions(quote);
    await this.simulate(actions);
    return this.submit(actions);
  }
}

export function createGhostModeClient(wallet: WalletAccountV6) {
  return new GhostModeClient(wallet);
}

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

  /** Analyzes whether an action fits a reviewed STRK20 route. This never submits. */
  analyze(input: CompatibilityInput) {
    return analyzeCompatibility(input);
  }

  /** Builds, but does not submit, the two-action private purchase transaction. */
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

  /** Simulates a private action set through the connected wallet without submission. */
  simulate(actions: WALLET_API.STRK20_ACTION[]) {
    return this.wallet.strk20PrepareInvoke(actions, true);
  }

  /** Requests wallet proof generation and submission for an already-reviewed action set. */
  submit(actions: WALLET_API.STRK20_ACTION[]) {
    return this.wallet.strk20InvokeTransaction(actions);
  }

  /** Simulates first and submits only if simulation succeeds. */
  async executePurchase(quote: PaymentQuote) {
    const actions = this.purchaseActions(quote);
    await this.simulate(actions);
    return this.submit(actions);
  }
}

export function createGhostModeClient(wallet: WalletAccountV6) {
  return new GhostModeClient(wallet);
}

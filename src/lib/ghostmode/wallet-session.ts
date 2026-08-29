import { num, validateAndParseAddress, walletV6 } from "starknet";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";

type StarknetJsWallet = Parameters<typeof walletV6.requestAccounts>[0];

export async function assertWalletSession(
  wallet: WalletWithStarknetFeatures | undefined,
  expectedAddress: string,
  expectedChain: string,
) {
  if (!wallet) throw new Error("WALLET_NOT_CONNECTED: reconnect the wallet. No transaction was submitted.");
  const boundary = wallet as unknown as StarknetJsWallet;
  const accounts = await walletV6.requestAccounts(boundary);
  if (!Array.isArray(accounts) || !accounts[0]) throw new Error("WALLET_NOT_CONNECTED: the wallet returned no active account. No transaction was submitted.");
  const liveAddress = validateAndParseAddress(accounts[0]);
  const liveChain = String(await walletV6.requestChainId(boundary));
  if (num.toBigInt(liveAddress) !== num.toBigInt(expectedAddress)) {
    throw new Error(`ACCOUNT_CHANGED: wallet now reports ${liveAddress}. The pending quote was invalidated and no transaction was submitted.`);
  }
  if (liveChain !== expectedChain) {
    throw new Error(`WRONG_NETWORK: wallet reports ${liveChain}; expected ${expectedChain}. No transaction was submitted.`);
  }
  return { address: liveAddress, chainId: liveChain };
}

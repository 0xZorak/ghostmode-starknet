import { constants, num, validateAndParseAddress, walletV6 } from "starknet";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";

type StarknetJsWallet = Parameters<typeof walletV6.requestAccounts>[0];

export function normalizeChainId(value: string): string {
  const chainId = String(value);
  if (chainId === "SN_MAIN" || chainId === "SN_SEPOLIA") return chainId;
  try {
    const felt = num.toBigInt(chainId);
    if (felt === num.toBigInt(constants.StarknetChainId.SN_MAIN)) return "SN_MAIN";
    if (felt === num.toBigInt(constants.StarknetChainId.SN_SEPOLIA)) return "SN_SEPOLIA";
  } catch {
    // Preserve unknown values so the caller still rejects unsupported networks.
  }
  return chainId;
}

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
  const reportedChain = String(await walletV6.requestChainId(boundary));
  const liveChain = normalizeChainId(reportedChain);
  const normalizedExpectedChain = normalizeChainId(expectedChain);
  if (num.toBigInt(liveAddress) !== num.toBigInt(expectedAddress)) {
    throw new Error(`ACCOUNT_CHANGED: wallet now reports ${liveAddress}. The pending quote was invalidated and no transaction was submitted.`);
  }
  if (liveChain !== normalizedExpectedChain) {
    throw new Error(`WRONG_NETWORK: wallet reports ${reportedChain}; expected ${normalizedExpectedChain}. No transaction was submitted.`);
  }
  return { address: liveAddress, chainId: liveChain };
}

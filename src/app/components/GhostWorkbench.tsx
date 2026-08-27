"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { constants as StarknetConstants, hash, num } from "starknet";
import SelectWallet from "./client/WalletHandle/SelectWallet";
import { useStoreWallet } from "./Wallet/walletContext";
import { planAgentAction } from "@/lib/ghostmode/planner";
import { compileAdapterManifest, isPaymentQuote, normalizeEndpoint } from "@/lib/ghostmode/adapter";
import { analyzeCompatibility, compatibilityPresets } from "@/lib/ghostmode/compatibility";
import { createGhostModeClient } from "@/lib/ghostmode/client";
import type { AdapterActionKind, AdapterManifest, CompatibilityInput, CompatibilityReport, PaymentQuote, PrivacyPlan } from "@/lib/ghostmode/types";
import {
  addrSTRK,
  GhostModeChainId,
  GhostModeExplorerBaseUrl,
  GhostModeProviderIndex,
  GhostModeTargetNetwork,
  myFrontendProviders,
} from "@/utils/constants";
import styles from "../uni.module.css";

type RunState = "idle" | "loading" | "success" | "error";

type Receipt = {
  state: RunState;
  title: string;
  detail?: string;
  hash?: string;
  helpHref?: string;
  helpLabel?: string;
};

type PrivacyRegistration = "unknown" | "required" | "ready";

type ChainEvidence = {
  latestBlock: number;
  publicStrk: string;
  totalDeposited: string;
  deposits: Array<{ block: number; hash: string; amount: string }>;
};

type PendingShield = {
  address: string;
  fromBlock: number;
  createdAt: number;
};

type Readiness = {
  readyForShieldTesting: boolean;
  readyForPrivatePurchaseTesting: boolean;
  readyForResourceUnlockTesting: boolean;
  checks: {
    network: string;
    receiptGateConfigured: boolean;
    sellerConfigured: boolean;
    sellerVerifierConfigured: boolean;
    quoteSignerConfigured: boolean;
    receiptAuthorizationConfigured: boolean;
    quoteStore: string;
  };
};

const ONE_STRK = 10n ** 18n;
const SHIELD_AND_DISPLAYED_FEE = 3n * ONE_STRK;
const SEPOLIA_FAUCET_URL = "https://starknet-faucet.vercel.app/";
const RECEIPT_ACCEPTED_EVENT_SELECTOR = hash.getSelectorFromName("ReceiptAccepted");
const TIMEOUT_RECOVERY_ATTEMPTS = 60;
const TIMEOUT_RECOVERY_INTERVAL_MS = 3_000;
const PENDING_SHIELD_STORAGE_KEY = "ghostmode.pending-shield.v1";

function shorten(value: string, head = 8, tail = 6) {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function formatStrk(raw: string) {
  const value = BigInt(raw);
  const whole = value / ONE_STRK;
  const fractional = (value % ONE_STRK).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole.toString();
}

function supportsWalletApi(versions: string[]) {
  return versions.some((version) => {
    const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
    return major > 0 || minor > 10 || (minor === 10 && patch >= 3);
  });
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; error?: { message?: unknown }; data?: { message?: unknown } };
    const nested = candidate.message ?? candidate.error?.message ?? candidate.data?.message;
    if (typeof nested === "string") return nested;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

function isTimeoutLike(detail: string) {
  const normalized = detail.toLowerCase();
  return normalized.includes("timeout") || normalized.includes("timed out");
}

function isUserRejected(detail: string) {
  const normalized = detail.toLowerCase();
  return normalized.includes("rejected") || normalized.includes("denied") || normalized.includes("cancelled") || normalized.includes("canceled");
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export default function GhostWorkbench() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const workbenchRef = useRef<HTMLElement>(null);
  const walletAccount = useStoreWallet((state) => state.myWalletAccount);
  const connected = useStoreWallet((state) => state.isConnected);
  const address = useStoreWallet((state) => state.address);
  const chain = useStoreWallet((state) => state.chain);
  const wallet = useStoreWallet((state) => state.StarknetWalletObject);
  const walletApiVersions = useStoreWallet((state) => state.walletApiList);

  const [endpoint, setEndpoint] = useState("/api/demo-intel");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [plan, setPlan] = useState<PrivacyPlan | null>(null);
  const [manifest, setManifest] = useState<AdapterManifest | null>(null);
  const [compatibilityInput, setCompatibilityInput] = useState<CompatibilityInput>({
    name: "Private lending deposit",
    kind: "lending",
    contract: "",
    selector: "privacy_invoke",
    externalInvokes: 1,
    outputMode: "open-note",
    existingPrivateRoute: "none",
    hideCalldata: false,
    hideContractState: false,
  });
  const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport | null>(null);
  const [registration, setRegistration] = useState<PrivacyRegistration>("unknown");
  const [publicStrkBalance, setPublicStrkBalance] = useState<bigint | null>(null);
  const [chainEvidence, setChainEvidence] = useState<ChainEvidence | null>(null);
  const [pendingShield, setPendingShield] = useState<PendingShield | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [quoteState, setQuoteState] = useState<RunState>("idle");
  const [receipt, setReceipt] = useState<Receipt>({ state: "idle", title: "No private action submitted" });
  const ghostMode = useMemo(() => walletAccount ? createGhostModeClient(walletAccount) : null, [walletAccount]);

  const expectedChain = GhostModeTargetNetwork === "mainnet"
    ? StarknetConstants.StarknetChainId.SN_MAIN
    : StarknetConstants.StarknetChainId.SN_SEPOLIA;
  const isExpectedNetwork = chain === expectedChain;
  const networkLabel = GhostModeTargetNetwork === "mainnet" ? "Starknet mainnet" : "Starknet Sepolia";
  const walletName = wallet?.name ?? "your wallet";
  const isXverseWallet = walletName.toLowerCase().includes("xverse");
  const hasPrivateWalletApi = supportsWalletApi(walletApiVersions);
  const configured = useMemo(() => {
    if (!quote) return false;
    try {
      return num.toBigInt(quote.seller) !== 0n && num.toBigInt(quote.gate) !== 0n;
    } catch {
      return false;
    }
  }, [quote]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dialogRef.current?.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setRegistration("unknown");
  }, [address, chain]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PENDING_SHIELD_STORAGE_KEY);
      if (stored) setPendingShield(JSON.parse(stored) as PendingShield);
    } catch {
      window.localStorage.removeItem(PENDING_SHIELD_STORAGE_KEY);
    }
  }, []);

  const rememberPendingShield = (value: PendingShield) => {
    setPendingShield(value);
    window.localStorage.setItem(PENDING_SHIELD_STORAGE_KEY, JSON.stringify(value));
  };

  const clearPendingShield = () => {
    setPendingShield(null);
    window.localStorage.removeItem(PENDING_SHIELD_STORAGE_KEY);
  };

  useEffect(() => {
    let active = true;
    void fetch("/api/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: Readiness) => { if (active) setReadiness(value); })
      .catch(() => { if (active) setReadiness(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!connected || !address || !isExpectedNetwork) {
      setPublicStrkBalance(null);
      return () => { active = false; };
    }

    const readPublicBalance = async () => {
      try {
        const [low = "0x0", high = "0x0"] = await myFrontendProviders[GhostModeProviderIndex].callContract({
          contractAddress: addrSTRK,
          entrypoint: "balance_of",
          calldata: [address],
        });
        if (active) setPublicStrkBalance(num.toBigInt(low) + (num.toBigInt(high) << 128n));
      } catch {
        if (active) setPublicStrkBalance(null);
      }
    };

    void readPublicBalance();
    const refresh = window.setInterval(() => { void readPublicBalance(); }, 15_000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [address, connected, isExpectedNetwork]);

  const fetchChainEvidence = async (accountAddress: string, fromBlock?: number) => {
    const query = new URLSearchParams({ address: accountAddress });
    if (fromBlock !== undefined) query.set("fromBlock", fromBlock.toString());
    const response = await fetch(`/api/chain-evidence?${query.toString()}`, { cache: "no-store" });
    const payload = await response.json() as ChainEvidence & { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Could not read Starknet evidence.");
    return payload;
  };

  const refreshChainEvidence = async () => {
    if (!address || !isExpectedNetwork) return;
    setEvidenceLoading(true);
    try {
      const evidence = await fetchChainEvidence(address);
      setChainEvidence(evidence);
      setPublicStrkBalance(BigInt(evidence.publicStrk));
    } finally {
      setEvidenceLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!connected || !address || !isExpectedNetwork) {
      setChainEvidence(null);
      return () => { active = false; };
    }
    const refresh = async () => {
      try {
        const evidence = await fetchChainEvidence(address);
        if (active) setChainEvidence(evidence);
      } catch {
        if (active) setChainEvidence(null);
      }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [address, connected, isExpectedNetwork]);

  const inspectPurchase = async () => {
    setQuoteState("loading");
    setReceipt({ state: "idle", title: "No private action submitted" });
    try {
      const inspectedEndpoint = normalizeEndpoint(endpoint);
      const response = await fetch(inspectedEndpoint, { cache: "no-store" });
      const payload = (await response.json()) as { quote?: unknown; message?: string };
      if (response.status !== 402 || !isPaymentQuote(payload.quote)) {
        throw new Error(payload.message ?? "The seller did not return a payment quote.");
      }
      setQuote(payload.quote);
      setManifest(compileAdapterManifest(inspectedEndpoint, payload.quote));
      setPlan(
        planAgentAction({
          kind: "purchase",
          endpoint: inspectedEndpoint,
          token: payload.quote.token,
          amount: payload.quote.amount,
          recipient: payload.quote.seller,
          description: payload.quote.resource.name,
        }),
      );
      setQuoteState("success");
    } catch (error) {
      setQuoteState("error");
      setReceipt({
        state: "error",
        title: "Quote inspection failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const waitForReceipt = async (txHash: string, title: string) => {
    const provider = myFrontendProviders[GhostModeProviderIndex];
    try {
      const result = await provider.waitForTransaction(txHash, { retries: 400, retryInterval: 3000 });
      const raw = result as unknown as { execution_status?: string; revert_reason?: string };
      if (raw.execution_status === "REVERTED") {
        setReceipt({
          state: "error",
          title: "Starknet transaction reverted",
          detail: raw.revert_reason ?? "The network rejected the submitted transaction.",
          hash: txHash,
        });
        return false;
      }
      setReceipt({ state: "success", title, detail: "Accepted on Starknet", hash: txHash });
      return true;
    } catch (error) {
      const detail = errorText(error);
      setReceipt({
        state: "idle",
        title: "Submitted; confirmation could not be verified yet",
        detail: `The wallet returned a transaction hash, so do not resubmit. Track it on Voyager while the RPC catches up. RPC detail: ${detail}`,
        hash: txHash,
        helpHref: `${GhostModeExplorerBaseUrl}/tx/${txHash}`,
        helpLabel: "Track on Voyager ↗",
      });
      return false;
    }
  };

  const depositHashesSince = async (fromBlock: number, accountAddress: string) => {
    const evidence = await fetchChainEvidence(accountAddress, fromBlock);
    return evidence.deposits
      .filter((deposit) => BigInt(deposit.amount) === ONE_STRK)
      .map((deposit) => deposit.hash);
  };

  const recoverTimedOutShield = async (fromBlock: number, accountAddress: string) => {
    for (let attempt = 0; attempt < TIMEOUT_RECOVERY_ATTEMPTS; attempt += 1) {
      try {
        const hashes = await depositHashesSince(fromBlock, accountAddress);
        const recovered = hashes[0];
        if (recovered) return recovered;
      } catch {
        // A second RPC attempt is safer than asking the user to resubmit a possibly accepted deposit.
      }
      if (attempt + 1 < TIMEOUT_RECOVERY_ATTEMPTS) await wait(TIMEOUT_RECOVERY_INTERVAL_MS);
    }
    return null;
  };

  const checkPendingShield = async () => {
    if (!pendingShield) return;
    setReceipt({ state: "loading", title: "Checking the pending shield on Starknet", detail: "GhostMode is looking only after the block recorded before that wallet request." });
    try {
      const hashes = await depositHashesSince(pendingShield.fromBlock, pendingShield.address);
      const recovered = hashes[0];
      if (recovered) {
        clearPendingShield();
        if (pendingShield.address === address) void refreshChainEvidence();
        setRegistration("ready");
        setReceipt({
          state: "success",
          title: "Late shield transaction recovered",
          detail: "The pool accepted the 1 STRK deposit after the wallet timed out. Do not shield again; read the private balance after note maturity.",
          hash: recovered,
        });
        return;
      }
      setReceipt({
        state: "idle",
        title: "Pending shield still has no pool deposit",
        detail: "Check wallet Activity. Keep this recovery marker unless the wallet shows the request was rejected or cancelled.",
        helpHref: `${GhostModeExplorerBaseUrl}/contract/${pendingShield.address}`,
        helpLabel: "Inspect account on Voyager ↗",
      });
    } catch (error) {
      setReceipt({ state: "error", title: "Could not check the pending shield", detail: errorText(error) });
    }
  };

  const recoverTimedOutPurchase = async (fromBlock: number, paymentQuote: PaymentQuote) => {
    for (let attempt = 0; attempt < TIMEOUT_RECOVERY_ATTEMPTS; attempt += 1) {
      try {
        const result = await myFrontendProviders[GhostModeProviderIndex].getEvents({
          from_block: { block_number: fromBlock },
          to_block: "latest",
          address: num.toHex(num.toBigInt(paymentQuote.gate)),
          keys: [
            [RECEIPT_ACCEPTED_EVENT_SELECTOR],
            [num.toHex(num.toBigInt(paymentQuote.quoteId))],
          ],
          chunk_size: 20,
        });
        const events = (result as unknown as {
          events?: Array<{ transaction_hash?: string; data?: string[] }>;
        }).events ?? [];
        const matching = events.find((event) =>
          event.transaction_hash &&
          event.data?.[0] &&
          num.toBigInt(event.data[0]) === num.toBigInt(paymentQuote.resourceCommitment));
        if (matching?.transaction_hash) return matching.transaction_hash;
      } catch {
        // Keep polling: relayed transactions can reach one RPC before another.
      }
      if (attempt + 1 < TIMEOUT_RECOVERY_ATTEMPTS) await wait(TIMEOUT_RECOVERY_INTERVAL_MS);
    }
    return null;
  };

  const shieldBudget = async () => {
    if (!ghostMode || !address) {
      setReceipt({ state: "error", title: "Connect a privacy-enabled wallet", detail: "GhostMode needs a Wallet API account before it can shield funds." });
      return;
    }
    if (!hasPrivateWalletApi) {
      setReceipt({ state: "error", title: "This wallet does not expose STRK20", detail: `${walletName} did not report Wallet API 0.10.3 or newer. Update it or connect a supported Ready/Xverse account.` });
      return;
    }
    if (!isExpectedNetwork) {
      setReceipt({ state: "error", title: `Switch to ${networkLabel}`, detail: `This build is locked to ${GhostModeChainId}.` });
      return;
    }
    if (GhostModeTargetNetwork === "mainnet") {
      setReceipt({
        state: "error",
        title: "Mainnet shielding is disabled in the fixed-amount demo",
        detail: "No transaction was submitted and funds are safe. Choose the amount explicitly in a privacy-enabled wallet after completing the mainnet checklist.",
      });
      return;
    }
    if (pendingShield) {
      setReceipt({
        state: "idle",
        title: "Resolve the previous shield attempt first",
        detail: "A wallet request is still marked as pending. Use Recover pending shield before creating another deposit.",
      });
      return;
    }
    let submissionBlock: number | null = null;
    try {
      const provider = myFrontendProviders[GhostModeProviderIndex];
      submissionBlock = await provider.getBlockNumber().catch(() => null);
      if (submissionBlock !== null) {
        rememberPendingShield({ address, fromBlock: submissionBlock + 1, createdAt: Date.now() });
      }
      setReceipt({ state: "loading", title: "Approve, then shield 1 STRK in your wallet", detail: "Shielding requires an ERC-20 approval followed by the pool deposit." });
      const tx = await ghostMode.shield(addrSTRK, ONE_STRK);
      clearPendingShield();
      setReceipt({ state: "loading", title: "Shield transaction submitted", hash: tx.transaction_hash });
      if (await waitForReceipt(tx.transaction_hash, "Agent budget shielded")) setRegistration("ready");
    } catch (error) {
      const detail = errorText(error);
      if (isTimeoutLike(detail)) {
        setReceipt({
          state: "loading",
          title: "Wallet response timed out — checking the pool",
          detail: "Do not click Shield again. GhostMode is checking whether the deposit was accepted despite the wallet timeout.",
        });
        // `submissionBlock` was already accepted before the wallet request began,
        // so only later blocks can contain this attempt. This prevents an older
        // 1 STRK deposit from being mistaken for timeout recovery.
        const recovered = submissionBlock !== null
          ? await recoverTimedOutShield(submissionBlock + 1, address)
          : null;
        if (recovered) {
          clearPendingShield();
          void refreshChainEvidence();
          setRegistration("ready");
          setReceipt({
            state: "success",
            title: "Agent budget shielded",
            detail: "The wallet response timed out, but the STRK20 pool accepted the 1 STRK deposit. Do not submit it again.",
            hash: recovered,
          });
        } else {
          setReceipt({
            state: "error",
            title: "Wallet timed out before returning a hash",
            detail: isXverseWallet
              ? "No new 1 STRK pool deposit was found for this attempt. Xverse's dapp Wallet API is still rolling out; verify the balance in Xverse's native Privacy screen or use the Ready extension for dapp testing before retrying."
              : "No new 1 STRK pool deposit was found during recovery. Check the wallet Activity screen and use Read shielded balance before retrying, so you do not deposit twice.",
            helpHref: `${GhostModeExplorerBaseUrl}/contract/${address}`,
            helpLabel: "Inspect account on Voyager ↗",
          });
        }
      } else if (detail.includes("NOT_REGISTERED")) {
        clearPendingShield();
        setRegistration("required");
        setReceipt({
          state: "error",
          title: "Activate privacy inside your wallet first",
          detail: `Open ${walletName} on Sepolia, use its native Privacy/Shield screen once to register this account, then return here and retry. GhostMode cannot create or read your viewing key.`,
        });
      } else if (detail.toLowerCase().includes("insufficient")) {
        clearPendingShield();
        if (publicStrkBalance !== null && publicStrkBalance >= SHIELD_AND_DISPLAYED_FEE) {
          setReceipt({
            state: "error",
            title: "Wallet balance snapshot disagrees with Sepolia",
            detail: `The public RPC sees ${formatStrk(publicStrkBalance.toString())} STRK, enough for this request. Cancel the wallet prompt, switch the wallet away from Sepolia and back, reload GhostMode, reconnect the same account, then retry. If it persists, test one shield from the wallet's native Privacy screen to isolate a wallet-side issue.`,
            helpHref: `${GhostModeExplorerBaseUrl}/contract/${address}`,
            helpLabel: "Verify account on Voyager ↗",
          });
        } else {
          setReceipt({
            state: "error",
            title: "More public Sepolia STRK is required",
            detail: `Shielding 1 STRK also requires the wallet's network-fee allowance. Your screenshot reserves up to 2 STRK for fees, so fund this account with more than 3 STRK and retry. The unused fee allowance is not charged.`,
            helpHref: SEPOLIA_FAUCET_URL,
            helpLabel: "Open Sepolia faucet ↗",
          });
        }
      } else if (isUserRejected(detail)) {
        clearPendingShield();
        setReceipt({ state: "idle", title: "Shielding cancelled", detail: "The wallet request was rejected, so GhostMode did not submit another deposit." });
      } else {
        setReceipt({ state: "error", title: "Shielding failed", detail });
      }
    }
  };

  const unlockPaidResource = async (paymentQuote: PaymentQuote, transactionHash: string) => {
    const response = await fetch("/api/demo-intel/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: paymentQuote.quoteId, transactionHash }),
      cache: "no-store",
    });
    const result = await response.json() as { resourceReleased?: boolean; resource?: unknown; message?: string; error?: string };
    if (response.ok && result.resourceReleased) {
      setReceipt({
        state: "success",
        title: "Private payment verified and resource unlocked",
        detail: JSON.stringify(result.resource),
        hash: transactionHash,
      });
      return;
    }
    setReceipt({
      state: "idle",
      title: "Payment confirmed; resource remains safely locked",
      detail: result.message ?? `Seller verification is incomplete (${result.error ?? "unknown"}). The transaction succeeded, but a public gate event alone is not proof that the seller received the private note.`,
      hash: transactionHash,
    });
  };

  const executePurchase = async () => {
    if (!quote || !ghostMode) {
      setReceipt({ state: "error", title: "Prepare the private route first", detail: "Inspect the quote and connect a privacy-enabled wallet." });
      return;
    }
    if (!isExpectedNetwork || quote.network !== GhostModeTargetNetwork) {
      setReceipt({ state: "error", title: `Switch to ${networkLabel}`, detail: `GhostMode refuses to submit a ${quote.chainId} quote from a different network.` });
      return;
    }
    if (!configured) {
      setReceipt({ state: "error", title: `${networkLabel} execution is not configured`, detail: "Set the deployed ReceiptGate and a registered seller address in the environment." });
      return;
    }
    if (GhostModeTargetNetwork === "mainnet" && !window.confirm(`MAINNET — REAL FUNDS\n\nPay ${formatStrk(quote.amount)} STRK for ${quote.resource.name}?`)) {
      setReceipt({ state: "idle", title: "Mainnet payment cancelled", detail: "No transaction was submitted and funds did not move." });
      return;
    }

    let submissionBlock: number | null = null;
    try {
      const actions = ghostMode.purchaseActions(quote);
      setReceipt({ state: "loading", title: "Simulating the private purchase", detail: "The wallet will prove and simulate the atomic route before submission." });
      await ghostMode.simulate(actions);
      submissionBlock = await myFrontendProviders[GhostModeProviderIndex].getBlockNumber().catch(() => null);
      setReceipt({ state: "loading", title: "Confirm the private purchase in your wallet", detail: "One encrypted transfer + one ReceiptGate invoke" });
      const tx = await ghostMode.submit(actions);
      setReceipt({ state: "loading", title: "Private purchase submitted", hash: tx.transaction_hash });
      if (await waitForReceipt(tx.transaction_hash, "Private purchase confirmed")) {
        await unlockPaidResource(quote, tx.transaction_hash);
      }
    } catch (error) {
      const detail = errorText(error);
      if (isTimeoutLike(detail)) {
        setReceipt({
          state: "loading",
          title: "Wallet response timed out — checking ReceiptGate",
          detail: "Do not resubmit. GhostMode is checking the quote commitment onchain.",
        });
        const recovered = submissionBlock !== null
          ? await recoverTimedOutPurchase(submissionBlock + 1, quote)
          : null;
        if (recovered) {
          await unlockPaidResource(quote, recovered);
        } else {
          setReceipt({
            state: "error",
            title: "Wallet timed out before returning a hash",
            detail: "ReceiptGate did not show this quote during recovery. Check wallet Activity before retrying; never pay the same quote twice.",
          });
        }
      } else if (isUserRejected(detail)) {
        setReceipt({ state: "idle", title: "Private purchase cancelled", detail: "The wallet request was rejected and the quote was not resubmitted." });
      } else {
        setReceipt({ state: "error", title: "Private purchase failed", detail });
      }
    }
  };

  const readBalances = async () => {
    if (!ghostMode) {
      setReceipt({ state: "error", title: "Connect a privacy-enabled wallet", detail: "Shielded balances are decrypted inside the wallet." });
      return;
    }
    try {
      setReceipt({ state: "loading", title: "Reading encrypted notes" });
      const balances = await ghostMode.balances();
      const value = (balances as { value?: unknown }).value ?? balances;
      setRegistration("ready");
      setReceipt({ state: "success", title: "Shielded balances discovered", detail: JSON.stringify(value) });
    } catch (error) {
      const detail = errorText(error);
      if (detail.includes("NOT_REGISTERED")) {
        setRegistration("required");
        setReceipt({ state: "error", title: "Privacy is not active for this account", detail: `Open ${walletName} on Sepolia and complete its native privacy activation before reading shielded balances.` });
      } else if (isTimeoutLike(detail)) {
        setReceipt({ state: "error", title: "Wallet balance request timed out", detail: "Reopen the wallet, approve shielded-balance access, and retry. No transaction was submitted." });
      } else if (isUserRejected(detail)) {
        setReceipt({ state: "idle", title: "Balance request cancelled", detail: "The wallet did not share private balance data." });
      } else {
        setReceipt({ state: "error", title: "Balance discovery failed", detail });
      }
    }
  };

  const downloadJson = (value: AdapterManifest | CompatibilityReport, filename: string) => {
    const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const exportManifest = () => {
    if (!manifest) return;
    downloadJson(manifest, "ghostmode-adapter.json");
    setReceipt({ state: "success", title: "Adapter manifest exported", detail: "The file contains the route, contract boundary, privacy claims and deployment target." });
  };

  const selectCompatibilityKind = (kind: AdapterActionKind) => {
    setCompatibilityReport(null);
    setCompatibilityInput((current) => ({ ...current, kind, ...compatibilityPresets[kind] }));
  };

  const compileCompatibility = () => {
    const report = analyzeCompatibility(compatibilityInput);
    setCompatibilityReport(report);
    setReceipt({
      state: report.verdict === "unsupported" ? "error" : "success",
      title: report.verdict === "unsupported" ? "Private route rejected" : "Compatibility report compiled",
      detail: report.summary,
    });
  };

  const exportCompatibility = () => {
    if (!compatibilityReport) return;
    downloadJson(compatibilityReport, "ghostmode-compatibility.json");
    setReceipt({ state: "success", title: "Compatibility manifest exported", detail: "Share this boundary report before anyone writes or deploys an adapter." });
  };

  const openWorkbench = () => {
    dialogRef.current?.close();
    workbenchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={styles.pageShell}>
      <header className={styles.navbar}>
        <a className={styles.wordmark} href="#top" aria-label="GhostMode home">
          <span className={styles.wordmarkMark} aria-hidden="true">G/</span>
          GhostMode
        </a>
        <nav className={styles.navLinks} aria-label="Primary navigation">
          <a href="#workbench">Product</a>
          <a href="#visibility">Privacy</a>
          <a href="#adapter">Build</a>
          <a href="https://strk20.starknet.io/docs" target="_blank" rel="noreferrer">Docs ↗</a>
        </nav>
        <button className={styles.commandPill} onClick={() => dialogRef.current?.showModal()} aria-label="Open action menu">
          <span aria-hidden="true">⌕</span>
          <span className={styles.commandText}>Command</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className={styles.navTelemetry} aria-label="Network telemetry">
          <span><i data-status="online" />Pool online</span>
          <span><i data-status={readiness?.readyForPrivatePurchaseTesting ? "online" : "pending"} />{GhostModeChainId}</span>
        </div>
        <SelectWallet variant="nav" />
      </header>

      <dialog ref={dialogRef} className={styles.commandDialog} onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}>
        <div className={styles.commandHead}>
          <span>Run GhostMode</span>
          <button className={styles.iconButton} onClick={() => dialogRef.current?.close()} aria-label="Close action menu">×</button>
        </div>
        <button className={styles.commandAction} onClick={openWorkbench}>
          <span>Inspect private intelligence purchase</span><span aria-hidden="true">↵</span>
        </button>
        <a className={styles.commandAction} href="#visibility" onClick={() => dialogRef.current?.close()}>
          <span>Read the threat model</span><span aria-hidden="true">↗</span>
        </a>
      </dialog>

      <main id="top">
        <section className={styles.intro} aria-labelledby="page-title">
          <div className={styles.introCopy}>
            <p className={styles.statusLine}><span className={styles.statusDot} /> Privacy execution layer · {networkLabel}</p>
            <h1 id="page-title">Private execution for autonomous agents.</h1>
            <p className={styles.lede}>GhostMode evaluates what an agent action can truly hide, selects a reviewed STRK20 route, and refuses private execution when its guarantees cannot be met.</p>
            {GhostModeTargetNetwork === "mainnet" ? <p className={`${styles.receiptBar} ${styles.receipt_error}`}><strong>MAINNET — REAL FUNDS</strong> Every payment requires explicit confirmation. Fixed-amount shielding is disabled.</p> : null}
            <div className={styles.heroActions}>
              <button className={styles.heroPrimary} onClick={openWorkbench}>Launch Agent Console <span aria-hidden="true">↗</span></button>
              <a className={styles.heroSecondary} href="#pipeline">View Execution Flow <span aria-hidden="true">↓</span></a>
            </div>
            <dl className={styles.heroTelemetry}>
              <div><dt>Agent</dt><dd>GM-01 / ARMED</dd></div>
              <div><dt>Mode</dt><dd>SHIELDED</dd></div>
              <div><dt>Proof</dt><dd>{readiness?.readyForPrivatePurchaseTesting ? "AVAILABLE" : "STANDBY"}</dd></div>
            </dl>
          </div>
          <div id="pipeline" className={styles.routePreview} aria-label="GhostMode private execution pipeline">
            <div className={styles.routeConsoleHead}>
              <span>LIVE ROUTE / GM-01</span>
              <span><i /> LISTENING</span>
            </div>
            <div className={styles.routeStageRail}>
              <span>INTENT</span><b>→</b><span>SHIELD</span><b>→</b><span>PROVE</span><b>→</b><span>EXECUTE</span><b>→</b><span>VERIFY</span>
            </div>
            <div className={styles.routeThreat}>
              <span>PUBLIC THREAT SURFACE</span>
              <p><s>in-pool owner link</s><s>private balance</s><s>encrypted-note link</s><span>timing remains public</span></p>
            </div>
            <div className={styles.routeRow}>
              <span className={styles.routeLabel}>PRIVATE ROUTE</span>
              <span className={styles.node}>ENCRYPTED INTENT</span><span className={styles.privateArrow}>⇢</span><span className={styles.node}>STRK20 POOL</span><span className={styles.privateArrow}>⇢</span><span className={styles.node}>ATOMIC CALL</span>
              <span className={styles.routeVerdict}>relationship concealed</span>
            </div>
            <div className={styles.routeConsoleFoot}>
              <span>NULLIFIER / PRIVATE</span>
              <span>SETTLEMENT / STARKNET</span>
              <span>POLICY / COMPLIANT</span>
            </div>
          </div>
        </section>

        <section id="workbench" ref={workbenchRef} className={styles.workbench} aria-labelledby="workbench-title">
          <div className={styles.workbenchHeader}>
            <div>
              <span className={styles.sectionKicker}>LIVE AGENT CONSOLE / 01—04</span>
              <h2 id="workbench-title">Inspect. Prove. Execute.</h2>
              <p>A real x402 challenge becomes one explicit privacy decision and one atomic STRK20 route.</p>
            </div>
            <div className={styles.connectionMeta}>
              <span>{connected ? `${walletName} · ${shorten(address)}` : "wallet offline"}</span>
              <span className={connected && hasPrivateWalletApi ? styles.good : styles.caution}>{connected ? (walletApiVersions.at(-1) ? `API ${walletApiVersions.at(-1)}` : "privacy API missing") : ""}</span>
              <span className={isExpectedNetwork ? styles.good : styles.caution}>{isExpectedNetwork ? GhostModeChainId : chain ? "wrong network" : "network unknown"}</span>
            </div>
          </div>

          <div className={styles.workbenchGrid}>
            <section className={styles.requestPane} aria-labelledby="request-title">
              <div className={styles.paneTitle}><span>01</span><h3 id="request-title">Requested action</h3></div>
              <dl className={styles.requestSpec}>
                <div><dt>Agent</dt><dd>research-operator-01</dd></div>
                <div><dt>Intent</dt><dd>Buy a fresh threat-intelligence snapshot</dd></div>
                <div><dt>Endpoint</dt><dd>{endpoint}</dd></div>
                <div><dt>Policy</dt><dd>Private payment required</dd></div>
              </dl>
              <label className={styles.endpointField}>
                <span>x402 endpoint</span>
                <input
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") void inspectPurchase(); }}
                  placeholder="https://api.example.com/intel"
                  inputMode="url"
                  spellCheck={false}
                />
              </label>
              <button
                className={styles.primaryButton}
                data-state={quoteState}
                onClick={inspectPurchase}
                disabled={quoteState === "loading"}
              >
                {quoteState === "loading" ? "Inspecting…" : quote ? "Refresh quote" : "Inspect public route"}
              </button>
              <p className={styles.helperText}>Use the included endpoint or a CORS-enabled endpoint returning a GhostMode 402 quote.</p>
            </section>

            <section className={styles.analysisPane} aria-labelledby="analysis-title" aria-live="polite">
              <div className={styles.paneTitle}><span>02</span><h3 id="analysis-title">Exposure diff</h3></div>
              {plan ? (
                <>
                  <div className={styles.riskSummary}><span>Privacy score / {plan.score.score} of {plan.score.maximum}</span><strong>{plan.route}</strong></div>
                  <div className={styles.findings}>
                    {plan.findings.map((finding) => (
                      <div className={styles.finding} key={finding.field}>
                        <span>{finding.field}</span>
                        <span className={styles.publicState}>{finding.publicRoute}</span>
                        <span aria-hidden="true">→</span>
                        <span className={finding.ghostRoute === "private" ? styles.privateState : styles.counterpartyState}>{finding.ghostRoute}</span>
                        <p>{finding.note}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.emptyAnalysis}>
                  <span aria-hidden="true">⌁</span>
                  <p>No route inspected yet. GhostMode will compare the public and shielded execution surfaces here.</p>
                </div>
              )}
            </section>
          </div>

          <section className={styles.executionPane} aria-labelledby="execution-title">
            <div className={styles.paneTitle}><span>03</span><h3 id="execution-title">Private execution</h3></div>
            <div className={styles.executionGrid}>
              <div className={styles.quoteBlock}>
                <span className={styles.blockLabel}>PAYMENT QUOTE</span>
                <strong>{quote?.resource.name ?? "Waiting for seller"}</strong>
                <dl>
                  <div><dt>Price</dt><dd>{quote ? `${formatStrk(quote.amount)} STRK` : "—"}</dd></div>
                  <div><dt>Network</dt><dd>{quote?.chainId ?? GhostModeChainId}</dd></div>
                  <div><dt>Seller</dt><dd>{quote ? shorten(quote.seller) : "—"}</dd></div>
                  <div><dt>Commitment</dt><dd>{quote ? shorten(quote.resourceCommitment) : "—"}</dd></div>
                  <div><dt>Gate</dt><dd>{quote ? shorten(quote.gate) : "—"}</dd></div>
                </dl>
              </div>
              <div className={styles.atomicBlock}>
                <span className={styles.blockLabel}>ONE POOL TRANSACTION</span>
                <div className={styles.atomicStep}><span>TRANSFER</span><strong>encrypted note → seller</strong></div>
                <div className={styles.atomicJoin}>+</div>
                <div className={styles.atomicStep}><span>INVOKE</span><strong>ReceiptGate → nonce + expiry</strong></div>
                <p>If the gate reverts, the private transfer reverts with it.</p>
              </div>
              <div className={styles.controlsBlock}>
                <span className={styles.blockLabel}>OPERATOR CONTROLS</span>
                <div className={styles.readinessBlock} data-ready={readiness?.readyForResourceUnlockTesting === true}>
                  <div><span>PRE-FLIGHT</span><strong>{readiness ? (readiness.readyForResourceUnlockTesting ? "READY" : "SETUP REQUIRED") : "CHECKING"}</strong></div>
                  <ul>
                    <li data-pass={hasPrivateWalletApi}>Wallet API 0.10.3+</li>
                    <li data-pass={isExpectedNetwork}>{networkLabel}</li>
                    <li data-pass={readiness?.checks.receiptGateConfigured === true}>ReceiptGate configured</li>
                    <li data-pass={readiness?.checks.receiptAuthorizationConfigured === true}>Signed receipt authority</li>
                    <li data-pass={readiness?.checks.sellerConfigured === true}>Seller configured</li>
                    <li data-pass={readiness?.checks.sellerVerifierConfigured === true}>Private-note verifier configured</li>
                  </ul>
                </div>
                {registration === "required" ? (
                  <div className={styles.registrationNotice}>
                    <strong>Wallet activation required</strong>
                    <p>Open {walletName} → Privacy/Shield on Sepolia and complete its first native shield. Then retry here.</p>
                  </div>
                ) : null}
                {connected && isXverseWallet ? (
                  <div className={styles.registrationNotice}>
                    <strong>Xverse dapp support is still rolling out</strong>
                    <p>Native shielding may work while Wallet API requests from GhostMode time out. Ready extension is the current reference path for dapp testing.</p>
                  </div>
                ) : null}
                <div className={styles.publicFunding} data-low={publicStrkBalance !== null && publicStrkBalance < ONE_STRK}>
                  <span>PUBLIC STRK</span>
                  <strong>{publicStrkBalance === null ? "Connect to check" : `${formatStrk(publicStrkBalance.toString())} STRK`}</strong>
                  <p>The shield amount and the wallet's fee allowance must both fit in this public balance.</p>
                  {GhostModeTargetNetwork === "sepolia" ? <a href={SEPOLIA_FAUCET_URL} target="_blank" rel="noreferrer">Get Sepolia STRK ↗</a> : null}
                </div>
                <div className={styles.chainEvidence} data-live={chainEvidence !== null}>
                  <div>
                    <span>PUBLIC POOL EVIDENCE</span>
                    <button type="button" onClick={() => void refreshChainEvidence()} disabled={evidenceLoading || !address}>
                      {evidenceLoading ? "Checking…" : "Refresh"}
                    </button>
                  </div>
                  {chainEvidence ? (
                    <>
                      <strong>{chainEvidence.deposits.length} accepted · {formatStrk(chainEvidence.totalDeposited)} STRK entered</strong>
                      <p>Verified through block {chainEvidence.latestBlock}. This proves deposits entered STRK20; only your wallet can decrypt the current unspent private balance.</p>
                      {chainEvidence.deposits.at(-1) ? (
                        <a href={`${GhostModeExplorerBaseUrl}/tx/${chainEvidence.deposits.at(-1)?.hash}`} target="_blank" rel="noreferrer">
                          Latest: {shorten(chainEvidence.deposits.at(-1)?.hash ?? "")} ↗
                        </a>
                      ) : null}
                    </>
                  ) : <p>{address ? "Checking Starknet…" : "Connect to verify deposits."}</p>}
                </div>
                <button className={styles.secondaryButton} onClick={shieldBudget} disabled={receipt.state === "loading"}>Shield 1 STRK</button>
                {pendingShield ? (
                  <>
                    <button className={styles.secondaryButton} onClick={() => void checkPendingShield()} disabled={receipt.state === "loading"}>Recover pending shield</button>
                    <button className={styles.tertiaryButton} onClick={clearPendingShield} disabled={receipt.state === "loading"} title="Only clear this after checking wallet Activity">Clear checked marker</button>
                  </>
                ) : null}
                <button className={styles.secondaryButton} onClick={readBalances} disabled={receipt.state === "loading"}>Read shielded balance</button>
                <button
                  className={styles.primaryButton}
                  onClick={executePurchase}
                  disabled={!quote || !connected || receipt.state === "loading"}
                  data-state={receipt.state}
                  title={!configured ? `Configure a deployed gate and registered seller to enable ${GhostModeTargetNetwork} execution` : undefined}
                >
                  {receipt.state === "loading" ? "Waiting for Starknet…" : "Execute private purchase"}
                </button>
              </div>
            </div>

            <div className={`${styles.receiptBar} ${styles[`receipt_${receipt.state}`]}`} role="status" aria-live="polite">
              <span className={styles.receiptSignal} aria-hidden="true" />
              <div><strong>{receipt.title}</strong>{receipt.detail ? <p>{receipt.detail}</p> : null}</div>
              {receipt.hash ? <a href={`${GhostModeExplorerBaseUrl}/tx/${receipt.hash}`} target="_blank" rel="noreferrer">{shorten(receipt.hash)} ↗</a> : receipt.helpHref ? <a href={receipt.helpHref} target="_blank" rel="noreferrer">{receipt.helpLabel ?? "Open help ↗"}</a> : null}
            </div>
          </section>

          <section id="adapter" className={styles.adapterStudio} aria-labelledby="adapter-title">
            <div className={styles.adapterIntro}>
              <div className={styles.paneTitle}><span>04</span><h3 id="adapter-title">Privacy compatibility compiler</h3></div>
              <p>Describe a Starknet action. GhostMode selects the honest STRK20 route—or rejects the request when an adapter cannot provide the privacy being promised.</p>
              <div className={styles.compilerForm}>
                <label>
                  <span>Action type</span>
                  <select value={compatibilityInput.kind} onChange={(event) => selectCompatibilityKind(event.target.value as AdapterActionKind)}>
                    <option value="private-transfer">Private transfer</option>
                    <option value="payment-gate">Payment + receipt gate</option>
                    <option value="swap">Swap</option>
                    <option value="lending">Lending / vault</option>
                    <option value="escrow">Escrow</option>
                    <option value="custom">Custom action</option>
                  </select>
                </label>
                <label>
                  <span>Action name</span>
                  <input value={compatibilityInput.name} onChange={(event) => setCompatibilityInput((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label>
                  <span>Target contract</span>
                  <input value={compatibilityInput.contract} onChange={(event) => setCompatibilityInput((current) => ({ ...current, contract: event.target.value }))} placeholder="0x… or reviewed helper" spellCheck={false} />
                </label>
                <label>
                  <span>External invokes</span>
                  <select value={compatibilityInput.externalInvokes} onChange={(event) => setCompatibilityInput((current) => ({ ...current, externalInvokes: Number(event.target.value) as 0 | 1 | 2 }))}>
                    <option value={0}>None</option>
                    <option value={1}>One</option>
                    <option value={2}>Two or more</option>
                  </select>
                </label>
                <label>
                  <span>Returned assets</span>
                  <select value={compatibilityInput.outputMode} onChange={(event) => setCompatibilityInput((current) => ({ ...current, outputMode: event.target.value as CompatibilityInput["outputMode"] }))}>
                    <option value="none">None</option>
                    <option value="encrypted-note">Encrypted note</option>
                    <option value="open-note">Runtime open note</option>
                  </select>
                </label>
                <label className={styles.compilerCheck}>
                  <input type="checkbox" checked={compatibilityInput.hideCalldata} onChange={(event) => setCompatibilityInput((current) => ({ ...current, hideCalldata: event.target.checked }))} />
                  <span>Contract calldata must be hidden</span>
                </label>
                <label className={styles.compilerCheck}>
                  <input type="checkbox" checked={compatibilityInput.hideContractState} onChange={(event) => setCompatibilityInput((current) => ({ ...current, hideContractState: event.target.checked }))} />
                  <span>Contract state must be hidden</span>
                </label>
              </div>
              <div className={styles.compilerActions}>
                <button className={styles.primaryButton} onClick={compileCompatibility}>Analyze compatibility</button>
                <button className={styles.secondaryButton} onClick={exportCompatibility} disabled={!compatibilityReport}>Export report</button>
                <button className={styles.secondaryButton} onClick={exportManifest} disabled={!manifest}>Export x402 adapter</button>
              </div>
            </div>
            <div className={styles.adapterOutput} aria-live="polite">
              {compatibilityReport ? (
                <>
                  <div className={styles.adapterSummary}>
                    <span>{compatibilityReport.route}</span>
                    <strong data-verdict={compatibilityReport.verdict}>{compatibilityReport.verdict}</strong>
                    <strong>{compatibilityReport.execution.externalInvokeBudget} invokes</strong>
                  </div>
                  {compatibilityReport.adapter ? (
                    <div className={styles.adapterSelection}>
                      <span>SELECTED ADAPTER</span>
                      <strong>{compatibilityReport.adapter.name}</strong>
                      <p>{compatibilityReport.adapter.status} · {compatibilityReport.adapter.source}</p>
                    </div>
                  ) : null}
                  <pre>{JSON.stringify(compatibilityReport, null, 2)}</pre>
                </>
              ) : (
                <div className={styles.adapterEmpty}>
                  <strong>No compatibility report yet</strong>
                  <p>Analyze the sample lending action, or change its constraints to test the privacy boundary.</p>
                </div>
              )}
            </div>
          </section>
        </section>

        <section id="visibility" className={styles.visibility} aria-labelledby="visibility-title">
          <div className={styles.visibilityIntro}>
            <h2 id="visibility-title">Private does not mean invisible.</h2>
            <p>GhostMode refuses the dangerous version of privacy marketing. It reports the edge, timing and counterparty metadata that STRK20 does not conceal.</p>
          </div>
          <div className={styles.visibilityColumns}>
            <div><span>HIDDEN IN THE POOL</span><p>Sender · receiver · token · amount · spent-note linkage</p></div>
            <div><span>STILL PUBLIC</span><p>Shield edge · timing · nullifier · opaque receipt commitment</p></div>
            <div><span>SELLER CAN SEE</span><p>HTTP request · requested resource · delivery timing · network metadata</p></div>
          </div>
        </section>
      </main>

      <footer className={styles.footerStatement}>
        <p>Agents should not broadcast the strategy they were hired to execute.</p>
        <div>
          <span>GhostMode / open source</span>
          <span>STRK20 · {GhostModeChainId} · 2026</span>
        </div>
      </footer>
    </div>
  );
}

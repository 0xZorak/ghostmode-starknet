import type { AdapterManifest, PaymentQuote } from "./types";
import { assertQuoteIntegrity } from "./quote-integrity";

export function normalizeEndpoint(input: string): string {
  const value = input.trim();
  if (!value) throw new Error("Enter an x402 endpoint.");
  if (value.startsWith("/")) return value;

  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP or HTTPS endpoints can be inspected.");
  }
  return url.toString();
}

export function isPaymentQuote(value: unknown): value is PaymentQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<PaymentQuote>;
  const structurallyValid = quote.version === "ghostmode-http402/0.2"
    && (quote.network === "sepolia" || quote.network === "mainnet")
    && (quote.chainId === "SN_SEPOLIA" || quote.chainId === "SN_MAIN")
    && typeof quote.quoteId === "string"
    && typeof quote.nonce === "string"
    && typeof quote.termsCommitment === "string"
    && typeof quote.resourceCommitment === "string"
    && typeof quote.seller === "string"
    && typeof quote.gate === "string"
    && typeof quote.token === "string"
    && typeof quote.amount === "string"
    && typeof quote.validUntil === "number"
    && quote.authorization?.scheme === "stark-curve"
    && typeof quote.authorization.r === "string"
    && typeof quote.authorization.s === "string"
    && !!quote.resource
    && typeof quote.resource.name === "string";
  if (!structurallyValid) return false;
  try {
    assertQuoteIntegrity(quote as PaymentQuote);
    return true;
  } catch {
    return false;
  }
}

export function compileAdapterManifest(endpoint: string, quote: PaymentQuote): AdapterManifest {
  return {
    schema: "ghostmode-adapter/0.1",
    source: {
      endpoint,
      quoteVersion: quote.version,
      quoteId: quote.quoteId,
    },
    target: {
      network: quote.network,
      chainId: quote.chainId,
      walletApi: ">=0.10.3",
      token: quote.token,
      seller: quote.seller,
      gate: quote.gate,
    },
    execution: {
      route: "strk20-private-invoke",
      atomic: true,
      simulateBeforeSubmit: true,
      actions: [
        { order: 1, type: "transfer", purpose: "Create an encrypted payment note for the registered seller." },
        { order: 2, type: "invoke", purpose: "Consume the quote commitment through ReceiptGate in the same pool transaction." },
      ],
    },
    privacy: {
      hidden: ["buyer identity inside the pool", "seller relationship", "payment token", "payment amount", "spent-note linkage"],
      visible: ["initial shield edge", "pool transaction timing", "ReceiptGate invocation", "opaque quote commitment", "HTTP request to the seller"],
    },
    contract: {
      template: "ReceiptGate",
      source: "cairo/src/lib.cairo",
      constructor: ["STRK20_POOL_ADDRESS", "SELLER_AUTHORITY_PUBLIC_KEY"],
      guarantees: ["pool-only caller", "seller-authorized request", "quote expiry", "quote replay prevention", "atomic revert with payment"],
      limitation: "The gate records quote acceptance; the seller must still discover the private note before releasing the resource.",
    },
  };
}

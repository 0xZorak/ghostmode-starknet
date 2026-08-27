import type { AdapterActionKind, CompatibilityInput, GhostModeAdapter } from "./types";

export const GHOSTMODE_ADAPTERS: readonly GhostModeAdapter[] = [
  {
    id: "strk20-private-transfer",
    name: "STRK20 encrypted transfer",
    status: "ready",
    source: "STRK20 Wallet API",
    kinds: ["private-transfer"],
    networks: ["sepolia", "mainnet"],
    review: "no-cairo",
    privacy: {
      hidden: ["sender/recipient relationship", "token", "amount", "note linkage"],
      public: ["pool interaction timing", "shield and unshield edges"],
    },
    requirements: ["A privacy-enabled wallet exposing STRK20 Wallet API 0.10.3 or newer."],
  },
  {
    id: "receipt-gate-x402",
    name: "Atomic private x402 receipt gate",
    status: "configuration-required",
    source: "cairo/src/lib.cairo",
    kinds: ["payment-gate"],
    networks: ["sepolia", "mainnet"],
    review: "local-review-required",
    privacy: {
      hidden: ["buyer/seller relationship", "payment token", "payment amount", "private note"],
      public: ["gate address", "quote commitment", "expiry", "transaction timing"],
    },
    requirements: [
      "Deploy the reviewed ReceiptGate with the exact STRK20 pool address.",
      "Configure the registered seller and a seller-side note verifier before releasing resources.",
    ],
  },
  {
    id: "avnu-private-swap",
    name: "AVNU private swap",
    status: "upstream-supported",
    source: "STRK20 Wallet API AVNU route",
    kinds: ["swap"],
    networks: ["mainnet"],
    review: "upstream-route",
    privacy: {
      hidden: ["private owner", "spent-note linkage"],
      public: ["swap calldata", "input/output assets and amounts required by the route"],
    },
    requirements: ["Use the wallet's supported AVNU private-swap operation instead of a generated helper."],
  },
  {
    id: "reviewed-private-invoke",
    name: "Reviewed privacy_invoke helper",
    status: "reference-only",
    source: "STRK20 anonymizer contract pattern",
    kinds: ["lending", "escrow", "custom"],
    networks: ["sepolia", "mainnet"],
    review: "reference-only",
    privacy: {
      hidden: ["private note owner", "spent-note linkage"],
      public: ["helper call", "target calldata", "target contract state and events", "open-note outputs"],
    },
    requirements: [
      "Implement and review a protocol-specific helper; GhostMode never treats arbitrary generated Cairo as audited.",
      "Enforce the one-external-invoke budget and exact returned-token balance delta.",
    ],
  },
] as const;

export function adapterFor(input: CompatibilityInput): GhostModeAdapter | null {
  if (input.kind === "swap" && input.existingPrivateRoute === "avnu-private-swap") {
    return GHOSTMODE_ADAPTERS.find((adapter) => adapter.id === "avnu-private-swap") ?? null;
  }
  return GHOSTMODE_ADAPTERS.find((adapter) => adapter.kinds.includes(input.kind)) ?? null;
}

export function adapterForKind(kind: AdapterActionKind): GhostModeAdapter | null {
  return GHOSTMODE_ADAPTERS.find((adapter) => adapter.kinds.includes(kind)) ?? null;
}

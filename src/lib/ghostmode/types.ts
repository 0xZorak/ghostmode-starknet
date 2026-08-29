export type ExposureLevel = "public" | "counterparty" | "private";

export type PrivacyProperty = "sender" | "recipient" | "amount" | "token";

export type PrivacyRequirements = {
  hideSender: boolean;
  hideRecipient: boolean;
  hideAmount: boolean;
  hideToken: boolean;
};

export type PrivacyIntent = {
  action: "payment" | "transfer" | "contract-invoke" | "swap";
  network: "starknet-sepolia" | "starknet-mainnet";
  token: string;
  amount: string;
  recipient?: string;
  requirements: PrivacyRequirements;
  capabilities?: {
    privacyWallet: boolean;
    privateInvoke: boolean;
    recipientRegistered?: boolean;
  };
};

export type PrivacyRoute =
  | "STRK20_PRIVATE_TRANSFER"
  | "STRK20_PRIVATE_INVOKE"
  | "PUBLIC_STARKNET"
  | "UNSUPPORTED";

export type PrivacyEvaluation = {
  supported: boolean;
  route: PrivacyRoute;
  privacy: Record<PrivacyProperty, ExposureLevel>;
  publicLeakage: string[];
  warnings: string[];
  reasons: Record<PrivacyProperty | "timing" | "entryExit", string>;
  reason?: string;
  errorCode?: "INVALID_INTENT" | "PRIVATE_ROUTE_UNAVAILABLE" | "UNSUPPORTED_ACTION";
  alternatives: string[];
};

export type PrivacyScore = {
  score: number;
  maximum: 100;
  breakdown: Array<{
    property: string;
    earned: number;
    possible: number;
    reason: string;
  }>;
};

export type AgentPaymentRequestV1 = {
  version: "1";
  requestId: string;
  network: "starknet";
  chainId: "SN_SEPOLIA" | "SN_MAIN";
  seller: string;
  token: string;
  amount: string;
  expiresAt: number;
  resource: string;
  nonce: string;
  privacy: {
    sender: boolean;
    recipient: boolean;
    amount: boolean;
    token: boolean;
  };
  receiptGate: string;
  resourceCommitment: string;
  authorization: {
    scheme: "stark-curve";
    r: string;
    s: string;
  };
};

export type PaymentStatus = "pending" | "submitted" | "verified" | "released" | "expired" | "rejected";

export type AgentAction = {
  kind: "purchase" | "transfer" | "swap";
  endpoint?: string;
  token: string;
  amount: string;
  recipient: string;
  description: string;
};

export type PrivacyFinding = {
  field: string;
  publicRoute: ExposureLevel;
  ghostRoute: ExposureLevel;
  note: string;
};

export type PrivacyPlan = {
  risk: "low" | "medium" | "high";
  route: "strk20-private-transfer" | "strk20-private-invoke";
  summary: string;
  findings: PrivacyFinding[];
  stillPublic: string[];
  requirements: string[];
  score: PrivacyScore;
};

export type PaymentQuote = {
  version: "ghostmode-http402/0.2";
  network: "sepolia" | "mainnet";
  chainId: "SN_SEPOLIA" | "SN_MAIN";
  quoteId: string;
  nonce: string;
  termsCommitment: string;
  resourceCommitment: string;
  seller: string;
  gate: string;
  token: string;
  amount: string;
  validUntil: number;
  authorization: {
    scheme: "stark-curve";
    r: string;
    s: string;
  };
  resource: {
    name: string;
    mediaType: string;
    preview: string;
  };
  proof: {
    type: "commitment";
    statement: string;
  };
};

export type AdapterManifest = {
  schema: "ghostmode-adapter/0.1";
  source: {
    endpoint: string;
    quoteVersion: PaymentQuote["version"];
    quoteId: string;
  };
  target: {
    network: PaymentQuote["network"];
    chainId: PaymentQuote["chainId"];
    walletApi: ">=0.10.3";
    token: string;
    seller: string;
    gate: string;
  };
  execution: {
    route: "strk20-private-invoke";
    atomic: true;
    simulateBeforeSubmit: true;
    actions: Array<{
      order: number;
      type: "transfer" | "invoke";
      purpose: string;
    }>;
  };
  privacy: {
    hidden: string[];
    visible: string[];
  };
  contract: {
    template: "ReceiptGate";
    source: "cairo/src/lib.cairo";
    constructor: ["STRK20_POOL_ADDRESS", "SELLER_AUTHORITY_PUBLIC_KEY"];
    guarantees: string[];
    limitation: string;
  };
};

export type AdapterActionKind = "private-transfer" | "payment-gate" | "swap" | "lending" | "escrow" | "custom";

export type AdapterOutputMode = "none" | "encrypted-note" | "open-note";

export type AdapterPrivateRoute = "none" | "avnu-private-swap";

export type CompatibilityInput = {
  name: string;
  kind: AdapterActionKind;
  contract: string;
  selector: string;
  externalInvokes: 0 | 1 | 2;
  outputMode: AdapterOutputMode;
  existingPrivateRoute: AdapterPrivateRoute;
  hideCalldata: boolean;
  hideContractState: boolean;
};

export type CompatibilityFinding = {
  surface: string;
  status: "hidden" | "visible" | "blocked";
  detail: string;
};

export type CompatibilityReport = {
  schema: "ghostmode-compatibility/0.1";
  verdict: "ready" | "adapter-required" | "unsupported";
  route: "strk20-private-transfer" | "strk20-private-invoke" | "avnu-private-swap" | "unsupported";
  summary: string;
  request: CompatibilityInput;
  execution: {
    walletApi: ">=0.10.3";
    externalInvokeBudget: "0 of 1" | "1 of 1" | "exceeded";
    atomic: boolean;
    actions: string[];
  };
  findings: CompatibilityFinding[];
  requirements: string[];
  adapter: {
    id: string;
    name: string;
    status: "ready" | "configuration-required" | "upstream-supported" | "reference-only";
    source: string;
  } | null;
  security: {
    cairoStatus: "not-required" | "template-review-required" | "not-applicable";
    statement: string;
  };
};

export type GhostModeAdapter = NonNullable<CompatibilityReport["adapter"]> & {
  kinds: AdapterActionKind[];
  networks: Array<"sepolia" | "mainnet">;
  review: "no-cairo" | "local-review-required" | "upstream-route" | "reference-only";
  privacy: {
    hidden: string[];
    public: string[];
  };
  requirements: string[];
};

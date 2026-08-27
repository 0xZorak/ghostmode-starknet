import type {
  AdapterActionKind,
  AdapterOutputMode,
  CompatibilityFinding,
  CompatibilityInput,
  CompatibilityReport,
} from "./types";
import { adapterFor } from "./registry";

export const compatibilityPresets: Record<AdapterActionKind, Pick<CompatibilityInput, "externalInvokes" | "outputMode" | "existingPrivateRoute">> = {
  "private-transfer": { externalInvokes: 0, outputMode: "encrypted-note", existingPrivateRoute: "none" },
  "payment-gate": { externalInvokes: 1, outputMode: "none", existingPrivateRoute: "none" },
  swap: { externalInvokes: 1, outputMode: "open-note", existingPrivateRoute: "avnu-private-swap" },
  lending: { externalInvokes: 1, outputMode: "open-note", existingPrivateRoute: "none" },
  escrow: { externalInvokes: 1, outputMode: "none", existingPrivateRoute: "none" },
  custom: { externalInvokes: 1, outputMode: "open-note", existingPrivateRoute: "none" },
};

function outputFinding(mode: AdapterOutputMode): CompatibilityFinding {
  if (mode === "open-note") {
    return {
      surface: "returned assets",
      status: "visible",
      detail: "The output token and amount must be public so the pool can create an open note for the private owner.",
    };
  }
  if (mode === "encrypted-note") {
    return {
      surface: "payment note",
      status: "hidden",
      detail: "Recipient, token and amount remain encrypted inside the STRK20 note.",
    };
  }
  return {
    surface: "returned assets",
    status: "hidden",
    detail: "No asset return is declared by this action.",
  };
}

export function analyzeCompatibility(input: CompatibilityInput): CompatibilityReport {
  const selectedAdapter = adapterFor(input);
  const adapter = selectedAdapter ? {
    id: selectedAdapter.id,
    name: selectedAdapter.name,
    status: selectedAdapter.status,
    source: selectedAdapter.source,
  } : null;
  const findings: CompatibilityFinding[] = [
    {
      surface: "private owner",
      status: "hidden",
      detail: "The user's relationship to pool notes is protected by the wallet-held viewing key.",
    },
    outputFinding(input.outputMode),
  ];
  const blockers: string[] = [];

  if (input.hideCalldata) {
    blockers.push("generic contract calldata cannot be hidden from the called Starknet contract");
    findings.push({ surface: "contract calldata", status: "blocked", detail: "privacy_invoke does not provide arbitrary confidential calldata." });
  } else if (input.externalInvokes > 0) {
    findings.push({ surface: "contract calldata", status: "visible", detail: "The helper address, selector and calldata are visible on Starknet." });
  }

  if (input.hideContractState) {
    blockers.push("public Starknet contract storage cannot become private through an adapter");
    findings.push({ surface: "contract storage", status: "blocked", detail: "State written by the target contract remains public." });
  } else if (input.externalInvokes > 0) {
    findings.push({ surface: "contract storage", status: "visible", detail: "Target-contract state changes and events remain public." });
  }

  if (input.externalInvokes > 1) {
    blockers.push("STRK20 permits at most one external invoke per private transaction");
    findings.push({ surface: "external calls", status: "blocked", detail: "Split the flow or redesign it behind one audited helper entry point." });
  }

  if (input.kind === "custom" && !input.contract.trim()) {
    blockers.push("a custom integration needs an explicit target contract");
  }

  const commonRequirements = [
    "A privacy-enabled wallet exposing STRK20 Wallet API 0.10.3 or newer.",
    "Registered participants and mature shielded notes before private execution.",
    "Simulation before submission and an explicit report of every public edge.",
  ];

  if (blockers.length > 0) {
    return {
      schema: "ghostmode-compatibility/0.1",
      verdict: "unsupported",
      route: "unsupported",
      summary: `This action is not honestly private through STRK20: ${blockers.join("; ")}.`,
      request: input,
      execution: {
        walletApi: ">=0.10.3",
        externalInvokeBudget: input.externalInvokes > 1 ? "exceeded" : input.externalInvokes === 1 ? "1 of 1" : "0 of 1",
        atomic: false,
        actions: [],
      },
      findings,
      requirements: commonRequirements,
      adapter: null,
      security: {
        cairoStatus: "not-applicable",
        statement: "GhostMode refuses to generate an adapter that would overstate STRK20's privacy guarantees.",
      },
    };
  }

  if (input.kind === "swap" && input.existingPrivateRoute === "avnu-private-swap") {
    return {
      schema: "ghostmode-compatibility/0.1",
      verdict: "ready",
      route: "avnu-private-swap",
      summary: "Use the first-party AVNU private-swap Wallet API route; a custom helper is unnecessary.",
      request: input,
      execution: {
        walletApi: ">=0.10.3",
        externalInvokeBudget: "1 of 1",
        atomic: true,
        actions: ["Quote the swap", "Simulate through the wallet", "Submit one private AVNU swap"],
      },
      findings,
      requirements: commonRequirements,
      adapter,
      security: {
        cairoStatus: "not-required",
        statement: "Prefer the protocol's supported private route over a generated helper.",
      },
    };
  }

  if (input.externalInvokes === 0) {
    return {
      schema: "ghostmode-compatibility/0.1",
      verdict: "ready",
      route: "strk20-private-transfer",
      summary: "This action maps directly to an encrypted STRK20 transfer with no helper contract.",
      request: input,
      execution: {
        walletApi: ">=0.10.3",
        externalInvokeBudget: "0 of 1",
        atomic: true,
        actions: ["Create one encrypted transfer note", "Simulate through the wallet", "Submit to the STRK20 pool"],
      },
      findings,
      requirements: commonRequirements,
      adapter,
      security: {
        cairoStatus: "not-required",
        statement: "No generated Cairo is needed for a normal private transfer.",
      },
    };
  }

  return {
    schema: "ghostmode-compatibility/0.1",
    verdict: "adapter-required",
    route: "strk20-private-invoke",
    summary: "This action fits one atomic STRK20 transfer/invoke route, but its helper must be reviewed and deployed.",
    request: input,
    execution: {
      walletApi: ">=0.10.3",
      externalInvokeBudget: "1 of 1",
      atomic: true,
      actions: [
        input.outputMode === "encrypted-note" ? "Create an encrypted transfer note" : "Expose only the input needed by the helper",
        `Invoke ${input.contract.trim() || "the reviewed helper"}::${input.selector.trim() || "privacy_invoke"}`,
        input.outputMode === "open-note" ? "Return the exact open-note balance delta to the pool" : "Return no open note unless assets flow back",
      ],
    },
    findings,
    requirements: [
      ...commonRequirements,
      "A reviewed privacy_invoke helper pinned to the expected STRK20 pool.",
      "Token approvals must target the pool, and returned assets must use the exact balance delta.",
    ],
    adapter,
    security: {
      cairoStatus: "template-review-required",
      statement: "The manifest is an integration plan, not an audit. Any helper must be reviewed before deployment.",
    },
  };
}

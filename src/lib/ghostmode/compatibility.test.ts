import { describe, expect, it } from "vitest";
import { analyzeCompatibility } from "./compatibility";
import type { CompatibilityInput } from "./types";

function request(overrides: Partial<CompatibilityInput> = {}): CompatibilityInput {
  return {
    name: "test action",
    kind: "payment-gate",
    contract: "0x123",
    selector: "privacy_invoke",
    externalInvokes: 1,
    outputMode: "none",
    existingPrivateRoute: "none",
    hideCalldata: false,
    hideContractState: false,
    ...overrides,
  };
}

describe("compatibility compiler", () => {
  it("selects a direct route for encrypted transfers", () => {
    const report = analyzeCompatibility(request({ kind: "private-transfer", externalInvokes: 0, outputMode: "encrypted-note" }));
    expect(report.verdict).toBe("ready");
    expect(report.adapter?.id).toBe("strk20-private-transfer");
  });

  it("selects the x402 receipt adapter without pretending it is deployed", () => {
    const report = analyzeCompatibility(request());
    expect(report.verdict).toBe("adapter-required");
    expect(report.adapter).toMatchObject({ id: "receipt-gate-x402", status: "configuration-required" });
  });

  it("rejects privacy claims STRK20 cannot satisfy", () => {
    const report = analyzeCompatibility(request({ hideCalldata: true, hideContractState: true, externalInvokes: 2 }));
    expect(report.verdict).toBe("unsupported");
    expect(report.adapter).toBeNull();
    expect(report.findings.filter((finding) => finding.status === "blocked")).toHaveLength(3);
  });
});

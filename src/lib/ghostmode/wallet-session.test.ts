import { describe, expect, it } from "vitest";
import { constants } from "starknet";
import { normalizeChainId } from "./wallet-session";

describe("wallet chain normalization", () => {
  it("accepts the wallet's felt-encoded Sepolia chain ID", () => {
    expect(normalizeChainId(constants.StarknetChainId.SN_SEPOLIA)).toBe("SN_SEPOLIA");
  });

  it("accepts the wallet's felt-encoded Mainnet chain ID", () => {
    expect(normalizeChainId(constants.StarknetChainId.SN_MAIN)).toBe("SN_MAIN");
  });

  it("preserves canonical and unknown chain IDs", () => {
    expect(normalizeChainId("SN_SEPOLIA")).toBe("SN_SEPOLIA");
    expect(normalizeChainId("SN_MAIN")).toBe("SN_MAIN");
    expect(normalizeChainId("SN_UNKNOWN")).toBe("SN_UNKNOWN");
  });
});

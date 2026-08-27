import { afterEach, describe, expect, it } from "vitest";
import { ec } from "starknet";
import { receiptAuthorizationHash, signReceiptAuthorization } from "./quote-authorization";

const previousPrivate = process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY;
const previousPublic = process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY;

afterEach(() => {
  if (previousPrivate === undefined) delete process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY;
  else process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY = previousPrivate;
  if (previousPublic === undefined) delete process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY;
  else process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY = previousPublic;
});

describe("receipt quote authorization", () => {
  it("signs the contract-domain-separated request and rejects key mismatches", () => {
    process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY = "0x123";
    const signed = signReceiptAuthorization("0x44", "0x11", "0x22", 1234);
    const digest = receiptAuthorizationHash("0x44", "0x11", "0x22", 1234);
    const signature = new ec.starkCurve.Signature(BigInt(signed.authorization.r), BigInt(signed.authorization.s));
    expect(ec.starkCurve.verify(signature, digest, ec.starkCurve.getPublicKey("0x123"))).toBe(true);

    process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY = "0x999";
    expect(() => signReceiptAuthorization("0x44", "0x11", "0x22", 1234)).toThrow(/KEY_MISMATCH/);
  });
});

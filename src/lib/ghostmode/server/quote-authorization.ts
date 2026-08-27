import { ec, hash, num } from "starknet";

export function receiptAuthorizationHash(
  gate: string,
  requestId: string,
  resourceCommitment: string,
  expiresAt: number,
) {
  return hash.computePoseidonHashOnElements([gate, requestId, resourceCommitment, expiresAt]);
}

export function signReceiptAuthorization(
  gate: string,
  requestId: string,
  resourceCommitment: string,
  expiresAt: number,
) {
  const privateKey = process.env.GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY;
  if (!privateKey) throw new Error("QUOTE_SIGNER_NOT_CONFIGURED");
  const messageHash = receiptAuthorizationHash(gate, requestId, resourceCommitment, expiresAt);
  const publicKey = num.toHex(ec.starkCurve.getStarkKey(privateKey));
  if (process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY
    && num.toBigInt(process.env.GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY) !== num.toBigInt(publicKey)) {
    throw new Error("QUOTE_SIGNER_KEY_MISMATCH");
  }
  const signature = ec.starkCurve.sign(messageHash, privateKey);
  return {
    authorization: { scheme: "stark-curve" as const, r: num.toHex(signature.r), s: num.toHex(signature.s) },
    publicKey,
  };
}

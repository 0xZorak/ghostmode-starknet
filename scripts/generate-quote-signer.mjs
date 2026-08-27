import { ec, num } from "starknet";

const privateKey = num.toHex(BigInt(`0x${Buffer.from(ec.starkCurve.utils.randomPrivateKey()).toString("hex")}`));
const publicKey = num.toHex(ec.starkCurve.getStarkKey(privateKey));
console.log("Generated a quote-only Stark-curve signer. Store the private value only in server secrets.");
console.log(`GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY=${privateKey}`);
console.log(`GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=${publicKey}`);

import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ec, num } from "starknet";

const privateKey = num.toHex(BigInt(`0x${Buffer.from(ec.starkCurve.utils.randomPrivateKey()).toString("hex")}`));
const publicKey = num.toHex(ec.starkCurve.getStarkKey(privateKey));
const outputPath = resolve(process.cwd(), process.env.GHOSTMODE_QUOTE_KEY_FILE || ".secrets/quote-signer.env");

if (existsSync(outputPath) && !process.argv.includes("--force")) {
  throw new Error(`Refusing to overwrite ${outputPath}. Pass --force only when deliberately rotating the signer.`);
}

mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
writeFileSync(
  outputPath,
  `GHOSTMODE_QUOTE_SIGNER_PRIVATE_KEY=${privateKey}\nGHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=${publicKey}\n`,
  { encoding: "utf8", mode: 0o600 },
);
chmodSync(outputPath, 0o600);

console.log(`Generated a quote-only Stark-curve signer in ${outputPath}.`);
console.log("The private key was not printed. Move it to the deployment secret manager, then delete the local file when safe.");
console.log(`GHOSTMODE_QUOTE_SIGNER_PUBLIC_KEY=${publicKey}`);

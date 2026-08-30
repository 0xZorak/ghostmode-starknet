import { randomBytes } from "node:crypto";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MAX_VIEWING_KEY } from "@starkware-libs/starknet-privacy-sdk";

let viewingKey = 0n;
while (viewingKey === 0n || viewingKey > MAX_VIEWING_KEY) {
  viewingKey = BigInt(`0x${randomBytes(32).toString("hex")}`);
}

const assignment = `SELLER_VIEWING_KEY=0x${viewingKey.toString(16)}`;

if (process.argv.includes("--write-env")) {
  const envPath = fileURLToPath(new URL("../.env.local", import.meta.url));
  const env = readFileSync(envPath, "utf8");
  const current = env.match(/^SELLER_VIEWING_KEY=(.*)$/m)?.[1]?.trim();
  if (current && current !== "0x...") {
    throw new Error("SELLER_VIEWING_KEY is already configured; refusing to overwrite it.");
  }
  if (!/^SELLER_VIEWING_KEY=.*$/m.test(env)) {
    throw new Error("SELLER_VIEWING_KEY entry is missing from .env.local.");
  }
  writeFileSync(envPath, env.replace(/^SELLER_VIEWING_KEY=.*$/m, assignment), { mode: 0o600 });
  chmodSync(envPath, 0o600);
  console.log("Seller viewing key generated and stored in the protected environment file.");
} else {
  console.log(assignment);
}

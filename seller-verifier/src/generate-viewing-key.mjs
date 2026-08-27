import { randomBytes } from "node:crypto";
import { MAX_VIEWING_KEY } from "@starkware-libs/starknet-privacy-sdk";

let viewingKey = 0n;
while (viewingKey === 0n || viewingKey > MAX_VIEWING_KEY) {
  viewingKey = BigInt(`0x${randomBytes(32).toString("hex")}`);
}

console.log(`SELLER_VIEWING_KEY=0x${viewingKey.toString(16)}`);

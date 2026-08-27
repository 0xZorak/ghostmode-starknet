import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { num } from "starknet";
import { provider, transfers } from "./privacy.mjs";

const requiredNames = [
  "GHOSTMODE_SELLER_VERIFIER_TOKEN",
  "SELLER_ACCOUNT_ADDRESS",
];

for (const name of requiredNames) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const verifiedQuotes = new Map();
const MAX_VERIFIED_QUOTES = 5_000;
const expectedToken = Buffer.from(process.env.GHOSTMODE_SELLER_VERIFIER_TOKEN);

function json(response, status, body) {
  const encoded = Buffer.from(JSON.stringify(body));
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": encoded.length,
    "Cache-Control": "no-store",
  });
  response.end(encoded);
}

function authorized(request) {
  const value = request.headers.authorization;
  if (!value?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(value.slice(7));
  return supplied.length === expectedToken.length && timingSafeEqual(supplied, expectedToken);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function verifyNote(body) {
  const { quoteId, requestId, transactionHash, seller, token, amount, network } = body ?? {};
  const paymentId = typeof requestId === "string" ? requestId : quoteId;
  if (![paymentId, transactionHash, seller, token, amount].every((value) => typeof value === "string") || network !== "sepolia") {
    return { status: 400, body: { verified: false, reason: "invalid_request" } };
  }
  let sellerAddress;
  let tokenAddress;
  let expectedAmount;
  try {
    sellerAddress = num.toBigInt(seller);
    tokenAddress = num.toBigInt(token);
    expectedAmount = num.toBigInt(amount);
    if (sellerAddress <= 0n || tokenAddress <= 0n || expectedAmount <= 0n || num.toBigInt(transactionHash) <= 0n || num.toBigInt(paymentId) <= 0n) {
      throw new Error("zero_value");
    }
  } catch {
    return { status: 400, body: { verified: false, reason: "invalid_felt" } };
  }
  if (sellerAddress !== num.toBigInt(process.env.SELLER_ACCOUNT_ADDRESS)) {
    return { status: 403, body: { verified: false, reason: "wrong_seller" } };
  }
  const cached = verifiedQuotes.get(paymentId);
  if (cached) return { status: 200, body: cached };

  const receipt = await provider.getTransactionReceipt(transactionHash);
  if (receipt.execution_status !== "SUCCEEDED" || typeof receipt.block_number !== "number") {
    return { status: 409, body: { verified: false, reason: "transaction_not_accepted" } };
  }

  const { notes } = await transfers.discoverNotes({ tokens: [tokenAddress] });
  const matches = (notes.get(tokenAddress) ?? []).filter((note) =>
    note.amount === expectedAmount && note.created === receipt.block_number);

  if (matches.length === 0) return { status: 200, body: { verified: false, reason: "seller_note_not_found" } };
  if (matches.length > 1) return { status: 409, body: { verified: false, reason: "ambiguous_seller_note" } };

  const result = {
    verified: true,
    paid: true,
    requestId: paymentId,
    verifiedAt: new Date().toISOString(),
    network: "sepolia",
    noteId: num.toHex(BigInt(matches[0].id)),
  };
  verifiedQuotes.set(paymentId, result);
  if (verifiedQuotes.size > MAX_VERIFIED_QUOTES) verifiedQuotes.delete(verifiedQuotes.keys().next().value);
  return { status: 200, body: result };
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      return json(response, 200, { ok: true, network: "SN_SEPOLIA", viewingOnly: true });
    }
    if (request.method !== "POST" || request.url !== "/verify-note") {
      return json(response, 404, { error: "not_found" });
    }
    if (!authorized(request)) return json(response, 401, { verified: false, reason: "unauthorized" });
    const result = await verifyNote(await readBody(request));
    return json(response, result.status, result.body);
  } catch {
    return json(response, 502, { verified: false, reason: "verification_unavailable" });
  }
});

server.listen(Number(process.env.PORT || 8787), "127.0.0.1", () => {
  console.log(`GhostMode seller verifier listening on http://127.0.0.1:${process.env.PORT || 8787}`);
});

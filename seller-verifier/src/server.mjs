import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { num } from "starknet";
import { provider, transfers } from "./privacy.mjs";
import { matchSellerPayment } from "./matching.mjs";

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
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const rateLimitWindowMs = 60_000;
const rateLimitMax = Number(process.env.RATE_LIMIT_PER_MINUTE || 60);
const clients = new Map();

if (expectedToken.length < 32) throw new Error("GHOSTMODE_SELLER_VERIFIER_TOKEN must contain at least 32 bytes");
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT must be an integer from 1 to 65535");
if (!Number.isInteger(rateLimitMax) || rateLimitMax < 1 || rateLimitMax > 10_000) throw new Error("RATE_LIMIT_PER_MINUTE is invalid");

function log(level, event, fields = {}) {
  const configured = process.env.LOG_LEVEL || "info";
  if (configured === "silent") return;
  if (configured === "error" && level !== "error") return;
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields })}\n`);
}

function json(response, status, body, requestId) {
  const encoded = Buffer.from(JSON.stringify(body));
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": encoded.length,
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
    "X-Content-Type-Options": "nosniff",
  });
  response.end(encoded);
}

function rateLimited(request) {
  const key = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const existing = clients.get(key);
  const record = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + rateLimitWindowMs } : existing;
  record.count += 1;
  clients.set(key, record);
  if (clients.size > 5_000) {
    for (const [address, value] of clients) if (value.resetAt <= now) clients.delete(address);
  }
  return record.count > rateLimitMax;
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
  const match = matchSellerPayment({
    notes: notes.get(tokenAddress) ?? [], receipt,
    poolAddress: process.env.STRK20_POOL_ADDRESS, expectedAmount,
  });
  if (match.status === "not_found") return { status: 200, body: { verified: false, reason: "seller_note_not_found" } };
  if (match.status === "ambiguous") return { status: 409, body: { verified: false, reason: "ambiguous_seller_note" } };
  const [matchedNote] = match.matches;

  const result = {
    verified: true,
    paid: true,
    requestId: paymentId,
    verifiedAt: new Date().toISOString(),
    network: "sepolia",
    noteId: num.toHex(BigInt(matchedNote.id)),
  };
  verifiedQuotes.set(paymentId, result);
  if (verifiedQuotes.size > MAX_VERIFIED_QUOTES) verifiedQuotes.delete(verifiedQuotes.keys().next().value);
  return { status: 200, body: result };
}

const server = createServer(async (request, response) => {
  const requestId = randomUUID();
  try {
    if (request.method === "GET" && request.url === "/health") {
      return json(response, 200, { ok: true, network: "SN_SEPOLIA", keyIsolation: "combined-spending-and-viewing" }, requestId);
    }
    if (request.method !== "POST" || request.url !== "/verify-note") {
      return json(response, 404, { error: "not_found" }, requestId);
    }
    if (rateLimited(request)) return json(response, 429, { verified: false, reason: "rate_limited" }, requestId);
    if (!authorized(request)) return json(response, 401, { verified: false, reason: "unauthorized" }, requestId);
    if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
      return json(response, 415, { verified: false, reason: "content_type_required" }, requestId);
    }
    const result = await verifyNote(await readBody(request));
    log("info", "verification_completed", { requestId, verified: result.body.verified === true, reason: result.body.reason });
    return json(response, result.status, result.body, requestId);
  } catch (error) {
    log("error", "verification_failed", { requestId, error: error instanceof Error ? error.name : "UnknownError" });
    return json(response, 502, { verified: false, reason: "verification_unavailable" }, requestId);
  }
});

server.listen(port, host, () => {
  log("info", "server_started", { host, port, network: "SN_SEPOLIA" });
});

function shutdown(signal) {
  log("info", "server_stopping", { signal });
  server.close((error) => {
    if (error) {
      log("error", "server_shutdown_failed", { error: error.name });
      process.exitCode = 1;
    }
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

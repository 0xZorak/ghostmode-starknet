import type { PaymentQuote, PaymentStatus } from "../types";

export type StoredQuote = {
  quote: PaymentQuote;
  resource: unknown;
  createdAt: number;
  status?: PaymentStatus;
  transactionHash?: string;
  verifiedAt?: number;
  noteId?: string;
};

const MAX_QUOTES = 250;

declare global {
  // Local development store. Production deployments should replace this module with durable storage.
  var ghostModeQuoteStore: Map<string, StoredQuote> | undefined;
}

const store = globalThis.ghostModeQuoteStore ?? new Map<string, StoredQuote>();
globalThis.ghostModeQuoteStore = store;

function removeExpired(now = Date.now()) {
  for (const [id, record] of store) {
    if (record.quote.validUntil * 1000 < now) store.delete(id);
  }
  while (store.size > MAX_QUOTES) {
    const oldest = store.keys().next().value as string | undefined;
    if (!oldest) break;
    store.delete(oldest);
  }
}

export function saveQuote(record: StoredQuote) {
  removeExpired();
  if (store.has(record.quote.quoteId)) throw new Error("PAYMENT_ALREADY_EXISTS");
  store.set(record.quote.quoteId, { ...record, status: "pending" });
}

export function findQuote(quoteId: string) {
  removeExpired();
  return store.get(quoteId) ?? null;
}

export function beginQuoteVerification(quoteId: string, transactionHash: string) {
  const record = findQuote(quoteId);
  if (!record) return { ok: false as const, reason: "not_found" as const };
  if (record.status === "released" || record.status === "verified") {
    return { ok: false as const, reason: "already_used" as const, record };
  }
  if (record.status === "submitted" && record.transactionHash !== transactionHash) {
    return { ok: false as const, reason: "verification_in_progress" as const, record };
  }
  record.status = "submitted";
  record.transactionHash = transactionHash;
  return { ok: true as const, record };
}

export function resetQuoteVerification(quoteId: string, transactionHash: string) {
  const record = store.get(quoteId);
  if (record?.status === "submitted" && record.transactionHash === transactionHash) {
    record.status = "pending";
    delete record.transactionHash;
  }
}

export function releaseQuote(quoteId: string, transactionHash: string, noteId: string) {
  const record = store.get(quoteId);
  if (!record || record.status !== "submitted" || record.transactionHash !== transactionHash) return false;
  record.status = "released";
  record.verifiedAt = Date.now();
  record.noteId = noteId;
  return true;
}

export function publicQuoteStatus(record: StoredQuote) {
  return {
    requestId: record.quote.quoteId,
    status: record.status ?? "pending",
    network: record.quote.network,
    expiresAt: record.quote.validUntil,
    transactionHash: record.transactionHash,
    verifiedAt: record.verifiedAt ? new Date(record.verifiedAt).toISOString() : undefined,
  };
}

export function quoteStoreMode() {
  return "ephemeral-local" as const;
}

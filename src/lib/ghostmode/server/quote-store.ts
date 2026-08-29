import postgres, { type Sql } from "postgres";
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

type QuoteRow = {
  quote: PaymentQuote;
  resource: unknown;
  created_at: string | number;
  status: PaymentStatus;
  transaction_hash: string | null;
  verified_at: string | number | null;
  note_id: string | null;
};

const MAX_QUOTES = 250;
const databaseUrl = process.env.DATABASE_URL;
let database: Sql | undefined;

declare global {
  var ghostModeQuoteStore: Map<string, StoredQuote> | undefined;
}

const memory = globalThis.ghostModeQuoteStore ?? new Map<string, StoredQuote>();
globalThis.ghostModeQuoteStore = memory;

function db() {
  if (!databaseUrl) return null;
  database ??= postgres(databaseUrl, { max: 5, idle_timeout: 20, connect_timeout: 10 });
  return database;
}

function assertStorageAvailable() {
  if (!databaseUrl && process.env.NODE_ENV === "production") throw new Error("STORAGE_NOT_CONFIGURED");
}

function fromRow(row: QuoteRow): StoredQuote {
  return {
    quote: row.quote,
    resource: row.resource,
    createdAt: Number(row.created_at),
    status: row.status,
    transactionHash: row.transaction_hash ?? undefined,
    verifiedAt: row.verified_at === null ? undefined : Number(row.verified_at),
    noteId: row.note_id ?? undefined,
  };
}

function pruneMemory(now = Date.now()) {
  for (const [id, record] of memory) {
    if (record.quote.validUntil * 1000 < now && record.status !== "released") memory.delete(id);
  }
  while (memory.size > MAX_QUOTES) {
    const oldest = memory.keys().next().value as string | undefined;
    if (!oldest) break;
    memory.delete(oldest);
  }
}

export async function saveQuote(record: StoredQuote) {
  assertStorageAvailable();
  const sql = db();
  if (sql) {
    const rows = await sql`
      insert into ghostmode_quotes
        (quote_id, quote, resource, created_at, valid_until, status)
      values
        (${record.quote.quoteId}, ${sql.json(record.quote)}, ${sql.json(record.resource as Parameters<typeof sql.json>[0])}, ${record.createdAt}, ${record.quote.validUntil}, 'pending')
      on conflict (quote_id) do nothing
      returning quote_id
    `;
    if (rows.length === 0) throw new Error("PAYMENT_ALREADY_EXISTS");
    return;
  }
  pruneMemory();
  if (memory.has(record.quote.quoteId)) throw new Error("PAYMENT_ALREADY_EXISTS");
  memory.set(record.quote.quoteId, { ...record, status: "pending" });
}

export async function findQuote(quoteId: string) {
  assertStorageAvailable();
  const sql = db();
  if (sql) {
    const [row] = await sql<QuoteRow[]>`
      select quote, resource, created_at, status, transaction_hash, verified_at, note_id
      from ghostmode_quotes where quote_id = ${quoteId} and valid_until >= ${Math.floor(Date.now() / 1000)}
    `;
    return row ? fromRow(row) : null;
  }
  pruneMemory();
  return memory.get(quoteId) ?? null;
}

export async function beginQuoteVerification(quoteId: string, transactionHash: string) {
  const sql = db();
  if (sql) return sql.begin(async (tx) => {
    const [transactionOwner] = await tx<{ quote_id: string }[]>`
      select quote_id from ghostmode_quotes where transaction_hash = ${transactionHash} for update
    `;
    if (transactionOwner && transactionOwner.quote_id !== quoteId) {
      return { ok: false as const, reason: "transaction_reused" as const };
    }
    const [row] = await tx<QuoteRow[]>`
      select quote, resource, created_at, status, transaction_hash, verified_at, note_id
      from ghostmode_quotes where quote_id = ${quoteId} and valid_until >= ${Math.floor(Date.now() / 1000)} for update
    `;
    if (!row) return { ok: false as const, reason: "not_found" as const };
    const record = fromRow(row);
    if (record.status === "released" || record.status === "verified") return { ok: false as const, reason: "already_used" as const, record };
    if (record.status === "submitted" && record.transactionHash !== transactionHash) return { ok: false as const, reason: "verification_in_progress" as const, record };
    await tx`update ghostmode_quotes set status = 'submitted', transaction_hash = ${transactionHash} where quote_id = ${quoteId}`;
    return { ok: true as const, record: { ...record, status: "submitted" as const, transactionHash } };
  });

  const record = await findQuote(quoteId);
  if (!record) return { ok: false as const, reason: "not_found" as const };
  for (const [otherId, other] of memory) {
    if (otherId !== quoteId && other.transactionHash === transactionHash) {
      return { ok: false as const, reason: "transaction_reused" as const };
    }
  }
  if (record.status === "released" || record.status === "verified") return { ok: false as const, reason: "already_used" as const, record };
  if (record.status === "submitted" && record.transactionHash !== transactionHash) return { ok: false as const, reason: "verification_in_progress" as const, record };
  record.status = "submitted";
  record.transactionHash = transactionHash;
  return { ok: true as const, record };
}

export async function resetQuoteVerification(quoteId: string, transactionHash: string) {
  const sql = db();
  if (sql) {
    await sql`update ghostmode_quotes set status = 'pending', transaction_hash = null where quote_id = ${quoteId} and status = 'submitted' and transaction_hash = ${transactionHash}`;
    return;
  }
  const record = memory.get(quoteId);
  if (record?.status === "submitted" && record.transactionHash === transactionHash) {
    record.status = "pending";
    delete record.transactionHash;
  }
}

export async function releaseQuote(quoteId: string, transactionHash: string, noteId: string) {
  const verifiedAt = Date.now();
  const sql = db();
  if (sql) {
    const rows = await sql`
      update ghostmode_quotes set status = 'released', verified_at = ${verifiedAt}, note_id = ${noteId}
      where quote_id = ${quoteId} and status = 'submitted' and transaction_hash = ${transactionHash} returning quote_id
    `;
    return rows.length === 1;
  }
  const record = memory.get(quoteId);
  if (!record || record.status !== "submitted" || record.transactionHash !== transactionHash) return false;
  record.status = "released";
  record.verifiedAt = verifiedAt;
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
  return databaseUrl ? "postgres" as const : "ephemeral-development" as const;
}

export function quoteStoreReady() {
  return Boolean(databaseUrl) || process.env.NODE_ENV !== "production";
}

export function quoteStoreDurable() {
  return Boolean(databaseUrl);
}

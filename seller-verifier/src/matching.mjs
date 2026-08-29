import { hash, num } from "starknet";

const ENC_NOTE_CREATED = num.toBigInt(hash.getSelectorFromName("EncNoteCreated"));

function asFelt(value) {
  try { return num.toBigInt(value); } catch { return null; }
}

export function encryptedNoteIdsFromReceipt(receipt, poolAddress) {
  const pool = asFelt(poolAddress);
  if (pool === null || !Array.isArray(receipt?.events)) return new Set();
  const ids = new Set();
  for (const event of receipt.events) {
    if (asFelt(event?.from_address) !== pool || asFelt(event?.keys?.[0]) !== ENC_NOTE_CREATED) continue;
    const noteId = asFelt(event?.keys?.[1]);
    if (noteId !== null && noteId > 0n) ids.add(noteId.toString());
  }
  return ids;
}

export function matchSellerPayment({ notes, receipt, poolAddress, expectedAmount }) {
  const emitted = encryptedNoteIdsFromReceipt(receipt, poolAddress);
  if (emitted.size === 0) return { status: "not_found", matches: [] };
  const matches = notes.filter((note) => {
    const id = asFelt(note?.id);
    const amount = asFelt(note?.amount);
    return id !== null && amount === expectedAmount && emitted.has(id.toString());
  });
  if (matches.length === 0) return { status: "not_found", matches };
  if (matches.length > 1) return { status: "ambiguous", matches };
  return { status: "matched", matches };
}

import { NextRequest, NextResponse } from "next/server";
import { hash, num, RpcProvider, validateAndParseAddress } from "starknet";
import {
  addrSTRK,
  GhostModePoolAddress,
  GhostModeTargetNetwork,
} from "@/utils/constants";
import { ghostModeServerRpcUrl } from "@/lib/ghostmode/server/network";

export const dynamic = "force-dynamic";

const DEPOSIT_EVENT_SELECTOR = hash.getSelectorFromName("Deposit");
const DEFAULT_LOOKBACK_BLOCKS = 20_000;
const MAX_LOOKBACK_BLOCKS = 100_000;

const recoveryRpc = new RpcProvider({
  nodeUrl: ghostModeServerRpcUrl(GhostModeTargetNetwork),
});

export async function GET(request: NextRequest) {
  const rawAddress = request.nextUrl.searchParams.get("address");
  if (!rawAddress) return NextResponse.json({ error: "address is required" }, { status: 400 });

  let address: string;
  try {
    address = validateAndParseAddress(rawAddress);
  } catch {
    return NextResponse.json({ error: "invalid Starknet address" }, { status: 400 });
  }

  try {
    const latestBlock = await recoveryRpc.getBlockNumber();
    const rawFrom = request.nextUrl.searchParams.get("fromBlock");
    const requestedFrom = rawFrom === null ? Number.NaN : Number(rawFrom);
    const defaultFrom = Math.max(0, latestBlock - DEFAULT_LOOKBACK_BLOCKS);
    const fromBlock = Number.isSafeInteger(requestedFrom) && requestedFrom >= 0
      ? Math.max(requestedFrom, latestBlock - MAX_LOOKBACK_BLOCKS)
      : defaultFrom;

    const [low = "0x0", high = "0x0"] = await recoveryRpc.callContract({
      contractAddress: addrSTRK,
      entrypoint: "balance_of",
      calldata: [address],
    });
    const publicStrk = num.toBigInt(low) + (num.toBigInt(high) << 128n);

    if (fromBlock > latestBlock) {
      return NextResponse.json({ latestBlock, publicStrk: publicStrk.toString(), deposits: [], totalDeposited: "0" });
    }

    const result = await recoveryRpc.getEvents({
      from_block: { block_number: fromBlock },
      to_block: "latest",
      address: GhostModePoolAddress,
      keys: [
        [DEPOSIT_EVENT_SELECTOR],
        [num.toHex(num.toBigInt(address))],
        [num.toHex(num.toBigInt(addrSTRK))],
      ],
      chunk_size: 100,
    });
    const deposits = result.events.map((event) => ({
      block: event.block_number,
      hash: event.transaction_hash,
      amount: num.toBigInt(event.data[0] ?? "0x0").toString(),
    }));
    const totalDeposited = deposits.reduce((sum, deposit) => sum + BigInt(deposit.amount), 0n);

    return NextResponse.json(
      { latestBlock, publicStrk: publicStrk.toString(), deposits, totalDeposited: totalDeposited.toString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "chain evidence query failed" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

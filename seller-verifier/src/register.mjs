import { cairo, getTipStatsFromBlocks, num } from "starknet";
import { account, provider, transfers } from "./privacy.mjs";

function conciseRpcError(error) {
  const rpc = error && typeof error === "object" ? error.baseError : null;
  if (rpc && typeof rpc === "object") {
    const data = typeof rpc.data === "string"
      ? rpc.data
      : rpc.data && typeof rpc.data === "object"
        ? rpc.data.revert_error ?? rpc.data.message ?? JSON.stringify(rpc.data)
        : "";
    return [`RPC ${rpc.code ?? "error"}`, rpc.message, data].filter(Boolean).join(": ");
  }
  return error instanceof Error ? error.message.split(" with params ")[0] : String(error);
}

try {
  const [registeredKey = "0x0"] = await provider.callContract({
    contractAddress: process.env.STRK20_POOL_ADDRESS,
    entrypoint: "get_public_key",
    calldata: [process.env.SELLER_ACCOUNT_ADDRESS],
  });
  if (num.toBigInt(registeredKey) !== 0n) {
    console.log("Seller is already registered; no transaction submitted.");
    process.exit(0);
  }

  const provingBlockId = (await provider.getBlockNumber()) - 10;
  const { callAndProof } = await transfers.build().register().execute({ provingBlockId });
  // Omit proof fields entirely when the prover returns no facts. Passing empty
  // arrays serializes an invalid v3 transaction in starknet.js.
  const proofFacts = callAndProof.proof.proofFacts ?? [];
  const proofDetails = proofFacts.length
    ? { proofFacts, proof: callAndProof.proof.data }
    : {};
  if (!proofFacts.length) throw new Error("The prover returned no proof facts.");

  // Both account.execute()'s internal estimate and estimateInvokeFee() can drop
  // proofFacts. The pool then sees an empty proof span and reverts before the
  // transaction can be estimated. Supplying live-price resource bounds skips
  // that incompatible estimation path. These are caps; actual usage is charged.
  const block = await provider.getBlock("latest");
  const priceOf = (key) => BigInt(block?.[key]?.price_in_fri ?? 0) || 1n;
  const resourceBounds = {
    l1_gas: { max_amount: 100n, max_price_per_unit: priceOf("l1_gas_price") * 2n },
    l2_gas: { max_amount: 60_000_000n, max_price_per_unit: priceOf("l2_gas_price") * 2n },
    l1_data_gas: { max_amount: 6_000n, max_price_per_unit: priceOf("l1_data_gas_price") * 2n },
  };
  const networkFeeCap = Object.values(resourceBounds).reduce(
    (total, bound) => total + bound.max_amount * bound.max_price_per_unit,
    0n,
  );
  const [poolFeeRaw = "0x0"] = await provider.callContract({
    contractAddress: process.env.STRK20_POOL_ADDRESS,
    entrypoint: "get_fee_amount",
  });
  const poolFee = num.toBigInt(poolFeeRaw);
  const [balanceLow = "0x0", balanceHigh = "0x0"] = await provider.callContract({
    contractAddress: process.env.STRK_TOKEN_ADDRESS ?? "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    entrypoint: "balance_of",
    calldata: [process.env.SELLER_ACCOUNT_ADDRESS],
  });
  const publicBalance = num.toBigInt(balanceLow) + (num.toBigInt(balanceHigh) << 128n);
  const requiredBalance = networkFeeCap + poolFee;
  if (publicBalance < requiredBalance) {
    const asStrk = (value) => (Number(value) / 1e18).toFixed(4);
    throw new Error(
      `Seller needs at least ${asStrk(requiredBalance)} public STRK for the ${asStrk(poolFee)} STRK pool fee plus the proof transaction cap; it currently has ${asStrk(publicBalance)} STRK.`,
    );
  }

  let tip = 1_000_000_000n;
  try {
    const stats = await getTipStatsFromBlocks(provider, { blockCount: 10 });
    const median = BigInt(stats?.median ?? stats?.medianTip ?? 0);
    if (median * 2n > tip) tip = median * 2n;
  } catch {
    // The deterministic floor still avoids submitting a zero-tip proof.
  }

  const fee = cairo.uint256(poolFee);
  const approvePoolFee = {
    contractAddress: process.env.STRK_TOKEN_ADDRESS ?? "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    entrypoint: "approve",
    calldata: [process.env.STRK20_POOL_ADDRESS, fee.low, fee.high],
  };

  const transaction = await account.execute([approvePoolFee, callAndProof.call], {
    tip,
    resourceBounds,
    ...proofDetails,
  });

  console.log(`Registration submitted: ${transaction.transaction_hash}`);
  await provider.waitForTransaction(transaction.transaction_hash);
  console.log(`Seller registered at proving block ${provingBlockId}.`);
} catch (error) {
  console.error(`Seller registration failed: ${conciseRpcError(error)}`);
  process.exitCode = 1;
}

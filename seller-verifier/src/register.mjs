import { account, provider, transfers } from "./privacy.mjs";

const provingBlockId = (await provider.getBlockNumber()) - 10;
const { callAndProof } = await transfers.build().register().execute({ provingBlockId });
const proofFacts = callAndProof.proofFacts ?? [];
const proofDetails = proofFacts.length
  ? { proofFacts, proof: callAndProof.proof.data }
  : {};

const transaction = await account.execute(callAndProof.call, {
  tip: 0n,
  ...proofDetails,
});

console.log(`Registration submitted: ${transaction.transaction_hash}`);
await provider.waitForTransaction(transaction.transaction_hash);
console.log(`Seller registered at proving block ${provingBlockId}.`);

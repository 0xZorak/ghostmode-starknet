import { existsSync, readFileSync } from "node:fs";

function readJson(path) {
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return {}; }
}

const deployment = readJson("deployments/sepolia.json");
const evidence = readJson("evidence/sepolia.json");
const checks = {
  sepoliaQuoteSigning: Boolean(evidence.quoteSigningVerified),
  currentReceiptGateDeployed: Boolean(deployment.contractAddress && deployment.classHash && deployment.deploymentTransaction && deployment.verified === true),
  sellerRegistered: Boolean(evidence.sellerRegistrationTransaction),
  sellerVerifierWorks: Boolean(evidence.sellerVerifierHealthUrl && evidence.sellerVerificationEvidence),
  privatePaymentSucceeds: Boolean(evidence.privatePaymentTransaction),
  resourceUnlockSucceeds: Boolean(evidence.resourceUnlockEvidence),
  replayProtectionProven: Boolean(evidence.replayProtectionEvidence),
  persistenceWorksAcrossRestart: Boolean(evidence.persistenceRestartEvidence),
  healthChecksPass: Boolean(evidence.healthEvidence),
  ciPasses: Boolean(evidence.ciRunUrl),
  secretsSecured: Boolean(evidence.secretManagementReviewed),
  privacyClaimsAudited: Boolean(evidence.privacyReview),
  internalSecurityReviewCompleted: Boolean(evidence.internalSecurityReview),
  completeDemoWorks: Boolean(evidence.demoEvidence),
};

const pass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ status: pass ? "PASS" : "FAIL", transacted: false, checks }, null, 2));
process.exitCode = pass ? 0 : 1;

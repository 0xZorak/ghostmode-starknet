import type { PrivacyEvaluation, PrivacyScore } from "./types";

const WEIGHTS = { sender: 20, recipient: 20, amount: 20, token: 15 } as const;

export function calculatePrivacyScore(evaluation: PrivacyEvaluation): PrivacyScore {
  const breakdown: PrivacyScore["breakdown"] = Object.entries(WEIGHTS).map(([property, possible]) => {
    const exposure = evaluation.privacy[property as keyof typeof WEIGHTS];
    const earned = exposure === "private" ? possible : exposure === "counterparty" ? Math.floor(possible / 2) : 0;
    return { property: `${property[0].toUpperCase()}${property.slice(1)} confidentiality`, earned, possible, reason: evaluation.reasons[property as keyof typeof WEIGHTS] };
  });
  breakdown.push(
    { property: "Timing resistance", earned: 0, possible: 10, reason: evaluation.reasons.timing },
    { property: "Network metadata", earned: 0, possible: 10, reason: "RPC, website, and transport metadata are outside STRK20 note privacy." },
    { property: "Entry/exit disclosure", earned: evaluation.route.startsWith("STRK20_") ? 5 : 0, possible: 5, reason: evaluation.reasons.entryExit },
  );
  return { score: breakdown.reduce((total, row) => total + row.earned, 0), maximum: 100, breakdown };
}

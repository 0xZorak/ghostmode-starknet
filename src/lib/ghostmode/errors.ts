export const ghostModeErrorCodes = [
  "CONFIGURATION_ERROR", "WALLET_NOT_CONNECTED", "ACCOUNT_CHANGED", "WRONG_NETWORK",
  "PRIVACY_NOT_REGISTERED", "PRIVACY_STATUS_UNKNOWN", "INSUFFICIENT_STRK",
  "INSUFFICIENT_PRIVATE_BALANCE", "PROVING_UNAVAILABLE", "INDEXER_UNAVAILABLE",
  "WALLET_TIMEOUT", "TRANSACTION_STATUS_UNKNOWN", "PRIVATE_ROUTE_UNAVAILABLE",
  "QUOTE_SIGNER_NOT_CONFIGURED", "QUOTE_INVALID", "QUOTE_EXPIRED", "QUOTE_REPLAYED",
  "SELLER_VERIFIER_UNAVAILABLE", "PAYMENT_NOT_FOUND", "PAYMENT_AMBIGUOUS",
  "RECEIPT_INVALID", "RESOURCE_ALREADY_CLAIMED", "STORAGE_NOT_CONFIGURED",
] as const;

export type GhostModeErrorCode = typeof ghostModeErrorCodes[number];

export type GhostModeErrorPayload = {
  error: GhostModeErrorCode;
  message: string;
  fundsMayHaveMoved: boolean;
  retrySafe: boolean;
  action: string;
  requestId?: string;
};

export function errorPayload(
  error: GhostModeErrorCode,
  message: string,
  options: { fundsMayHaveMoved?: boolean; retrySafe?: boolean; action: string; requestId?: string },
): GhostModeErrorPayload {
  return {
    error,
    message,
    fundsMayHaveMoved: options.fundsMayHaveMoved ?? false,
    retrySafe: options.retrySafe ?? false,
    action: options.action,
    requestId: options.requestId,
  };
}

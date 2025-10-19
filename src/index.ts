import type { PublicClient, WalletClient } from "wagmi";
import type {
  DecryptedTransaction,
  EERCHookResult,
  IntentExecutionData,
  SubmitIntentResult,
  IntentStatus,
} from "./hooks";

export { EERC } from "./EERC";
export { useEERC } from "./hooks";
export { Poseidon } from "./crypto";
export {
  saveIntentExecutionData,
  getIntentExecutionData,
  getAllStoredIntents,
  removeIntentExecutionData,
  clearAllIntents,
  exportIntents,
  importIntents,
} from "./utils/intentStorage";

export type { PublicClient as CompatiblePublicClient };
export type { WalletClient as CompatibleWalletClient };
export type {
  DecryptedTransaction,
  EERCHookResult,
  IntentExecutionData,
  SubmitIntentResult,
  IntentStatus,
};

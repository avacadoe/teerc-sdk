import type { IntentExecutionData } from "../hooks/types";

/**
 * Local storage key prefix for intent execution data
 */
const INTENT_STORAGE_PREFIX = "eerc_intent_";

/**
 * Save intent execution data to local storage
 * @param intentHash Hash of the intent
 * @param executionData Execution data to store
 */
export function saveIntentExecutionData(
  intentHash: string,
  executionData: IntentExecutionData,
): void {
  try {
    const key = `${INTENT_STORAGE_PREFIX}${intentHash}`;
    const data = {
      ...executionData,
      // Convert bigints to strings for JSON serialization
      amount: executionData.amount.toString(),
      tokenId: executionData.tokenId.toString(),
      nonce: executionData.nonce.toString(),
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save intent execution data:", error);
    throw new Error("Failed to save intent execution data to local storage");
  }
}

/**
 * Retrieve intent execution data from local storage
 * @param intentHash Hash of the intent
 * @returns Execution data or null if not found
 */
export function getIntentExecutionData(
  intentHash: string,
): IntentExecutionData | null {
  try {
    const key = `${INTENT_STORAGE_PREFIX}${intentHash}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);

    // Convert strings back to bigints
    return {
      amount: BigInt(data.amount),
      destination: data.destination,
      tokenId: BigInt(data.tokenId),
      nonce: BigInt(data.nonce),
      proof: data.proof,
      balancePCT: data.balancePCT,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("Failed to retrieve intent execution data:", error);
    return null;
  }
}

/**
 * Get all stored intents for the current user
 * @returns Array of intent hashes with their execution data
 */
export function getAllStoredIntents(): Array<{
  intentHash: string;
  executionData: IntentExecutionData;
  savedAt: number;
}> {
  try {
    const intents: Array<{
      intentHash: string;
      executionData: IntentExecutionData;
      savedAt: number;
    }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(INTENT_STORAGE_PREFIX)) {
        const intentHash = key.replace(INTENT_STORAGE_PREFIX, "");
        const stored = localStorage.getItem(key);

        if (stored) {
          const data = JSON.parse(stored);

          intents.push({
            intentHash,
            executionData: {
              amount: BigInt(data.amount),
              destination: data.destination,
              tokenId: BigInt(data.tokenId),
              nonce: BigInt(data.nonce),
              proof: data.proof,
              balancePCT: data.balancePCT,
              metadata: data.metadata,
            },
            savedAt: data.savedAt || 0,
          });
        }
      }
    }

    // Sort by most recent first
    return intents.sort((a, b) => b.savedAt - a.savedAt);
  } catch (error) {
    console.error("Failed to get all stored intents:", error);
    return [];
  }
}

/**
 * Remove intent execution data from local storage
 * @param intentHash Hash of the intent to remove
 */
export function removeIntentExecutionData(intentHash: string): void {
  try {
    const key = `${INTENT_STORAGE_PREFIX}${intentHash}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove intent execution data:", error);
  }
}

/**
 * Clear all stored intent execution data
 */
export function clearAllIntents(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(INTENT_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear all intents:", error);
  }
}

/**
 * Export all intents as JSON (for backup)
 * @returns JSON string of all intents
 */
export function exportIntents(): string {
  const intents = getAllStoredIntents();
  return JSON.stringify(intents, null, 2);
}

/**
 * Import intents from JSON (for restore)
 * @param json JSON string of intents to import
 * @returns Number of intents imported
 */
export function importIntents(json: string): number {
  try {
    const intents = JSON.parse(json) as Array<{
      intentHash: string;
      executionData: any;
      savedAt: number;
    }>;

    let count = 0;
    for (const { intentHash, executionData } of intents) {
      // Convert string amounts back to bigints
      const data: IntentExecutionData = {
        amount: BigInt(executionData.amount),
        destination: executionData.destination,
        tokenId: BigInt(executionData.tokenId),
        nonce: BigInt(executionData.nonce),
        proof: executionData.proof,
        balancePCT: executionData.balancePCT,
        metadata: executionData.metadata,
      };

      saveIntentExecutionData(intentHash, data);
      count++;
    }

    return count;
  } catch (error) {
    console.error("Failed to import intents:", error);
    throw new Error("Failed to import intents from JSON");
  }
}

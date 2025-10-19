# Phase 1 MVP - SDK Usage Guide

## Installation

```bash
npm install @avalabs/ac-eerc-sdk
# or
pnpm add @avalabs/ac-eerc-sdk
```

## New Methods (v2.0.62+)

### 1. Submit Withdraw Intent

Submit a private withdraw intent where amount and destination are hidden on-chain.

```typescript
import {
  EERC,
  saveIntentExecutionData,
  type SubmitIntentResult
} from '@avalabs/ac-eerc-sdk';

// Initialize SDK
const eerc = new EERC(
  publicClient,
  walletClient,
  contractAddress,
  registrarAddress,
  isConverter,
  decryptionKey,
  publicKey,
  snarkjsMode,
  circuitURLs,
  proveFunc
);

// Submit intent
const submitIntent = async () => {
  try {
    const amount = 1000000000000n; // 1000 tokens with 12 decimals
    const destination = "0xYourDestinationAddress...";
    const encryptedBalance = await eerc.getEncryptedBalance(userAddress, tokenAddress);
    const decryptedBalance = await eerc.decryptBalance(encryptedBalance);
    const auditorPublicKey = await eerc.fetchAuditorPublicKey();
    const tokenAddress = "0xTokenAddress...";
    const nonce = 1n; // Start with 1, increment for each new intent
    const memo = "Payment for services";

    // Submit intent
    const result: SubmitIntentResult = await eerc.submitWithdrawIntent(
      amount,
      destination,
      encryptedBalance,
      decryptedBalance,
      auditorPublicKey,
      tokenAddress,
      nonce,
      memo
    );

    console.log("Intent Hash:", result.intentHash);
    console.log("Transaction Hash:", result.transactionHash);

    // CRITICAL: Save execution data to local storage
    saveIntentExecutionData(result.intentHash, result.executionData);

    return result;
  } catch (error) {
    console.error("Failed to submit intent:", error);
    throw error;
  }
};
```

**What happens on-chain:**
- ✅ intentHash stored (one-way hash)
- ✅ Encrypted balance updated
- ✅ User's balance locked for this token
- ❌ Amount NOT visible
- ❌ Destination NOT visible

---

### 2. Execute Withdraw Intent

Execute a previously submitted intent (after 1 hour).

```typescript
import {
  EERC,
  getIntentExecutionData,
  type OperationResult
} from '@avalabs/ac-eerc-sdk';

const executeIntent = async (intentHash: string) => {
  try {
    // Retrieve execution data from local storage
    const executionData = getIntentExecutionData(intentHash);

    if (!executionData) {
      throw new Error("Execution data not found. Intent may not have been saved.");
    }

    // Check if intent is ready to execute
    const status = await eerc.getIntentStatus(intentHash);

    if (!status.canUserExecute) {
      throw new Error(`Intent not ready. Wait ${status.timeUntilExecutable} more seconds.`);
    }

    if (status.executed) {
      throw new Error("Intent already executed");
    }

    if (status.cancelled) {
      throw new Error("Intent was cancelled");
    }

    if (status.isExpired) {
      throw new Error("Intent has expired");
    }

    // Execute intent
    const result: OperationResult = await eerc.executeWithdrawIntent(
      intentHash,
      executionData
    );

    console.log("Execution Transaction Hash:", result.transactionHash);

    return result;
  } catch (error) {
    console.error("Failed to execute intent:", error);
    throw error;
  }
};
```

---

### 3. Check Intent Status

Check if an intent is ready to execute.

```typescript
import { EERC, type IntentStatus } from '@avalabs/ac-eerc-sdk';

const checkStatus = async (intentHash: string) => {
  const status: IntentStatus = await eerc.getIntentStatus(intentHash);

  console.log("Intent exists:", status.exists);
  console.log("User:", status.user);
  console.log("Executed:", status.executed);
  console.log("Cancelled:", status.cancelled);
  console.log("Can user execute:", status.canUserExecute);
  console.log("Can relayer execute:", status.canRelayerExecute);
  console.log("Is expired:", status.isExpired);
  console.log("Time until executable:", status.timeUntilExecutable, "seconds");

  return status;
};
```

---

### 4. Cancel Intent

Cancel a pending intent.

```typescript
const cancelIntent = async (intentHash: string) => {
  try {
    const result = await eerc.cancelWithdrawIntent(intentHash);

    console.log("Cancel Transaction Hash:", result.transactionHash);

    // Remove from local storage
    removeIntentExecutionData(intentHash);

    return result;
  } catch (error) {
    console.error("Failed to cancel intent:", error);
    throw error;
  }
};
```

---

## Local Storage Helpers

### Save Intent Data

```typescript
import { saveIntentExecutionData, type IntentExecutionData } from '@avalabs/ac-eerc-sdk';

// Automatically done by submitWithdrawIntent, but you can also do manually:
const executionData: IntentExecutionData = {
  amount: 1000000000000n,
  destination: "0x...",
  tokenId: 1n,
  nonce: 1n,
  proof: { ... },
  balancePCT: ["...", "..."],
  metadata: "0x..."
};

saveIntentExecutionData(intentHash, executionData);
```

### Retrieve Intent Data

```typescript
import { getIntentExecutionData } from '@avalabs/ac-eerc-sdk';

const executionData = getIntentExecutionData(intentHash);

if (executionData) {
  console.log("Amount:", executionData.amount);
  console.log("Destination:", executionData.destination);
}
```

### Get All Stored Intents

```typescript
import { getAllStoredIntents } from '@avalabs/ac-eerc-sdk';

const allIntents = getAllStoredIntents();

console.log(`You have ${allIntents.length} stored intents`);

for (const { intentHash, executionData, savedAt } of allIntents) {
  console.log(`Intent ${intentHash}:`);
  console.log(`  Amount: ${executionData.amount}`);
  console.log(`  Destination: ${executionData.destination}`);
  console.log(`  Saved at: ${new Date(savedAt).toLocaleString()}`);
}
```

### Export/Import (Backup/Restore)

```typescript
import { exportIntents, importIntents } from '@avalabs/ac-eerc-sdk';

// Export to JSON (for backup)
const backup = exportIntents();
localStorage.setItem('intent_backup', backup);

// Or download as file
const blob = new Blob([backup], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'intent_backup.json';
a.click();

// Import from JSON (for restore)
const backup = localStorage.getItem('intent_backup');
if (backup) {
  const count = importIntents(backup);
  console.log(`Restored ${count} intents`);
}
```

### Clear All Intents

```typescript
import { clearAllIntents } from '@avalabs/ac-eerc-sdk';

// Remove all stored intents
clearAllIntents();
```

---

## Frontend React Example

### Submit Intent Component

```typescript
import { useState } from 'react';
import { useEERC, saveIntentExecutionData } from '@avalabs/ac-eerc-sdk';

export function SubmitIntent() {
  const eerc = useEERC();
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [intentHash, setIntentHash] = useState('');

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const amountBigInt = BigInt(amount) * 1000000000000n; // 12 decimals
      const encryptedBalance = await eerc.getEncryptedBalance(userAddress, tokenAddress);
      const decryptedBalance = await eerc.decryptBalance(encryptedBalance);
      const auditorPublicKey = await eerc.fetchAuditorPublicKey();

      const result = await eerc.submitWithdrawIntent(
        amountBigInt,
        destination,
        encryptedBalance,
        decryptedBalance,
        auditorPublicKey,
        tokenAddress,
        1n, // nonce
        'Withdrawal'
      );

      setIntentHash(result.intentHash);
      saveIntentExecutionData(result.intentHash, result.executionData);

      alert(`Intent submitted! Hash: ${result.intentHash}`);
    } catch (error) {
      console.error(error);
      alert('Failed to submit intent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Submit Withdraw Intent</h2>

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        type="text"
        placeholder="Destination Address"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Generating Proof...' : 'Submit Intent'}
      </button>

      {intentHash && (
        <p>Intent Hash: {intentHash}</p>
      )}
    </div>
  );
}
```

### Pending Intents List

```typescript
import { useState, useEffect } from 'react';
import {
  useEERC,
  getAllStoredIntents,
  getIntentExecutionData,
  removeIntentExecutionData,
  type IntentStatus
} from '@avalabs/ac-eerc-sdk';

export function PendingIntents() {
  const eerc = useEERC();
  const [intents, setIntents] = useState<Array<{
    intentHash: string;
    status: IntentStatus | null;
    executionData: any;
  }>>([]);

  useEffect(() => {
    const loadIntents = async () => {
      const stored = getAllStoredIntents();

      const withStatus = await Promise.all(
        stored.map(async ({ intentHash, executionData }) => {
          try {
            const status = await eerc.getIntentStatus(intentHash);
            return { intentHash, status, executionData };
          } catch {
            return { intentHash, status: null, executionData };
          }
        })
      );

      setIntents(withStatus);
    };

    loadIntents();
  }, []);

  const handleExecute = async (intentHash: string) => {
    const executionData = getIntentExecutionData(intentHash);

    if (!executionData) {
      alert('Execution data not found');
      return;
    }

    try {
      const result = await eerc.executeWithdrawIntent(intentHash, executionData);
      alert(`Executed! TX: ${result.transactionHash}`);
      removeIntentExecutionData(intentHash);
      // Reload list
    } catch (error) {
      console.error(error);
      alert('Failed to execute');
    }
  };

  const handleCancel = async (intentHash: string) => {
    try {
      await eerc.cancelWithdrawIntent(intentHash);
      removeIntentExecutionData(intentHash);
      alert('Intent cancelled');
      // Reload list
    } catch (error) {
      console.error(error);
      alert('Failed to cancel');
    }
  };

  return (
    <div>
      <h2>Pending Intents ({intents.length})</h2>

      {intents.map(({ intentHash, status, executionData }) => (
        <div key={intentHash} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <p><strong>Intent:</strong> {intentHash.slice(0, 10)}...</p>
          <p><strong>Amount:</strong> {executionData.amount.toString()}</p>
          <p><strong>Destination:</strong> {executionData.destination}</p>

          {status && (
            <>
              <p><strong>Status:</strong> {
                status.executed ? 'Executed' :
                status.cancelled ? 'Cancelled' :
                status.isExpired ? 'Expired' :
                status.canUserExecute ? 'Ready to Execute' :
                `Wait ${Math.ceil(status.timeUntilExecutable / 60)} more minutes`
              }</p>

              {status.canUserExecute && !status.executed && !status.cancelled && (
                <button onClick={() => handleExecute(intentHash)}>
                  Execute Now
                </button>
              )}

              {!status.executed && !status.cancelled && (
                <button onClick={() => handleCancel(intentHash)}>
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Important Notes

### Privacy Considerations

1. **During Submission:**
   - Amount and destination are HIDDEN on-chain
   - Only intentHash is visible
   - User's balance is locked

2. **During Execution:**
   - Amount and destination are REVEALED
   - But if batched with other intents, observer cannot link to original user

3. **Local Storage:**
   - Execution data (amount/destination) is stored locally
   - User MUST keep this data or they cannot execute intent
   - Consider implementing backup/restore functionality

### Timing

- **0-1 hour:** Only user can execute
- **1-24 hours:** Only user can execute
- **24+ hours:** Anyone (relayer) can execute
- **7 days:** Intent expires

### Nonce Management

- Start with `nonce = 1n`
- Increment for each new intent
- Nonce is used in intentHash computation
- Must match during execution

### Error Handling

Common errors:
- `"Not allowed for stand alone!"` - Only works in converter mode
- `"Execution data not found"` - Local storage cleared or intent not saved
- `"Intent not ready"` - Wait until 1 hour has passed
- `"Intent already executed"` - Cannot execute twice
- `"OnlyIntentCreator"` - Only intent creator can cancel

---

## Testing on Fuji

Contract addresses:
- EncryptedERC: `0x3C5FD63b7a9f0487BA6fB0117764032a2eA3970c`
- Registrar: `[YOUR_REGISTRAR_ADDRESS]`

```typescript
const eerc = new EERC(
  publicClient,
  walletClient,
  "0x3C5FD63b7a9f0487BA6fB0117764032a2eA3970c",
  "[YOUR_REGISTRAR_ADDRESS]",
  true, // isConverter
  decryptionKey,
  publicKey,
  true, // snarkjsMode
  circuitURLs,
  proveFunc
);
```

---

## Next Steps (Phase 2)

Coming soon:
- Event listeners for real-time updates
- Backend API for cloud backup
- Relayer batch execution
- Enhanced status monitoring
- Intent scheduling

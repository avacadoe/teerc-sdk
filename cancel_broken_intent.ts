import { createWalletClient, createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const CANCEL_INTENT_ABI = [{
  name: "cancelWithdrawIntent",
  type: "function",
  stateMutability: "nonpayable",
  inputs: [
    { name: "intentHash", type: "bytes32" }
  ],
  outputs: []
}] as const;

const intentHash = "0x0ea1876314134ff2558086455a1fc192f3dbb3dfdc840ce2e1346cae9742e5b0";
const CONTRACT_ADDRESS = '0x5894792d827D56057718Ca15B266D1A7C4eb3682';
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ Please set PRIVATE_KEY environment variable");
    process.exit(1);
  }

  console.log("🗑️  Cancelling broken intent (tokenId 0 is not registered)...\n");

  const account = privateKeyToAccount(
    PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}` as `0x${string}`
  );

  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http('https://api.avax-test.network/ext/bc/C/rpc')
  });

  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http('https://api.avax-test.network/ext/bc/C/rpc')
  });

  console.log("👤 Cancelling from:", account.address);
  console.log("📋 Intent Hash:", intentHash);
  console.log("\n⏳ Submitting cancellation...\n");

  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CANCEL_INTENT_ABI,
      functionName: 'cancelWithdrawIntent',
      args: [intentHash as `0x${string}`]
    });

    console.log("✅ Cancellation submitted!");
    console.log("\n📝 Transaction Hash:", hash);
    console.log("\n⏳ Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log("\n🎉 SUCCESS! Intent cancelled!");
      console.log("\n✓ Your balance for tokenId 0 is now unlocked");
      console.log("✓ You can now create a new intent with the correct tokenId (1)");
      console.log("\n🔗 View on Explorer:");
      console.log(`   https://testnet.snowtrace.io/tx/${hash}`);
    } else {
      console.log("\n❌ Cancellation failed!");
      console.log("Receipt:", receipt);
    }
  } catch (error: any) {
    console.error("\n❌ Error cancelling intent:");
    console.error(error.shortMessage || error.message || error);
    process.exit(1);
  }
}

main();

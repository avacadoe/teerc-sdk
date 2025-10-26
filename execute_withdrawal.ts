import { EERC } from './src/EERC';
import { createWalletClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Intent parameters from deets
const intentHash = "6617776664500776537593132527440073464222415932323741946285243879280406095280";
const tokenId = 0n;
const amount = 1100n;
const destination = "0x29E43E3754A2Fa13cDdc25f34164A14552bd7951";
const nonce = 1n;

const proof = {
  proofPoints: {
    a: [
      "0x1d380273e52733fa0d2fbc40ae5605bd79f21ae77aabb9611b1dba51850a9dcd",
      "0x1f52278bbf598286a8591acfeaa9100876c2b2c5c09a529849d9ce969d596cf9"
    ],
    b: [
      [
        "0x15afd796ec5eb7bdd4c19fa26249417c6738bc744c4826e04f4d3e570b6870a3",
        "0x1b3b147f1cd054e93168eae9eb6595716c8514b587d5dbd51fcb4f5366917786"
      ],
      [
        "0x070ebc7b1622e0fb9b818c3668d00ec88dd075dbe8d285808dc23facc0d7b74b",
        "0x0c5910d660755adf67884efb69afe11db02525f43d14575dd55b876791740c6f"
      ]
    ],
    c: [
      "0x06a499de9352c9d5e6fcebb3c725caee78154360469a02bdf42598ba349fc372",
      "0x0d4324012bc9600d8b99769ae8f3fdc936a1f73305bf82482c7638219882df9a"
    ]
  },
  publicSignals: [
    "0x194a2e9c61050dadc45fdf18621a74696396b114966cc89e6d08b609707d9409",
    "0x235b41a2bee9cbefe228af938d8a6e88ce4984c29d9d4a1bbd95807988e41a40",
    "0x12f28cb13f54d1a355bf0833e2213335fc351747317b21c85c33bacf288bd608",
    "0x17aea374ea989fa76710bd73b69ea9ace90d649d712af054007a7b05f685d39d",
    "0x08499ec4381450d8f9592fdd1dcd24ec3a0f62b1b4b603b1ff7c4bb0c1740d8e",
    "0x1a351706381c38485c9644261dd4918a9f218fe17a0714cc1a7f8e40b1f46b69",
    "0x0fd68e06a5a218cb2cdaa39ce8dd9d9e50b374b2e1faa90ae16a116485184bc7",
    "0x1dc646d171166637d5ebaa6bd2a801ff4513043f01f9cd6a1a586fdac71adf89",
    "0x2921f666dacd099c49ea5f54811885d665d7710566560434ea54d941166e1b81",
    "0x2a88f877d072bd7aad52e0dd7c05a3a7b86ff5d38e1989229ccadd86ffbd0c80",
    "0x09e091ecb215fb75ea59522630ed644c8aadd03f0b9ce9b326d902d034c141cd",
    "0x14f28df6e39198760108d7ed6d8ba9f716daa07fa66afe1e530ff4e4cc7f8a30",
    "0x2772d6a8f2efb06d8b4d8595d8f16e73f47f2e3f97d82f5fc7cee90d99e394fa",
    "0x2bb5626b2436b570d561723ffeb4f993e6c1b07d4ce06da8156492d11bf1751f",
    "0x00000000000000000000000000000000573bb90e65ccc3cb1aa63158150a0078",
    "0x0ea1876314134ff2558086455a1fc192f3dbb3dfdc840ce2e1346cae9742e5b0"
  ]
};

const balancePCT = [
  "0x156d56f3b66978f060a2fd8a3d87c4400e42956db7422fd9ff2c9e69692e395d",
  "0x2c1e4c190dfde9ea588815844469983b45648e0931fce86a57163794779a6863",
  "0x030301a0ba3909f3c9a73afb1a47116fb2a0d4540dbcb9604298a5031d9f5557",
  "0x00a763c818aaa17d8055e88d0d606c34626952057c92b30f330856ed39f06f7a",
  "0x1b987dd7ce221aff62976f89713196a03cc97cecae7f9dce27bcab76c4cacae8",
  "0x1d961ac7d97425301f872348afda6df7fa171ef18610c261d097ba61d672cc24",
  "0x00000000000000000000000000000000aa696a34119d533bba5590f5f0722c48"
];

const metadata = "0x";

// You need to set your private key
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ Please set PRIVATE_KEY environment variable");
    console.error("\nUsage:");
    console.error("  export PRIVATE_KEY=your_private_key_here");
    console.error("  npx tsx execute_withdrawal.ts");
    process.exit(1);
  }

  console.log("🚀 Executing withdrawal intent...\n");

  // Create wallet
  const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}` as `0x${string}`);
  const wallet = createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http('https://api.avax-test.network/ext/bc/C/rpc')
  });

  console.log("👤 Executing from:", account.address);

  // Initialize EERC SDK
  const eerc = new EERC({
    contractAddress: '0x5894792d827D56057718Ca15B266D1A7C4eb3682',
    wallet,
    snarkjsMode: true,
    isConverter: true,
    decryptionKey: PRIVATE_KEY // Add decryption key
  });

  console.log("\n📋 Intent Details:");
  console.log("  Intent Hash:", intentHash);
  console.log("  Token ID:", tokenId.toString());
  console.log("  Amount:", amount.toString());
  console.log("  Destination:", destination);
  console.log("  Nonce:", nonce.toString());
  console.log("\n⏳ Executing withdrawal...\n");

  try {
    const result = await eerc.executeWithdrawIntent(
      intentHash,
      tokenId,
      destination,
      amount,
      nonce,
      proof,
      balancePCT,
      metadata
    );

    console.log("✅ SUCCESS!");
    console.log("\n📝 Transaction Hash:", result.transactionHash);
    console.log("\n🔗 View on Explorer:");
    console.log(`   https://testnet.snowtrace.io/tx/${result.transactionHash}`);
    console.log("\n🎉 Withdrawal completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Error executing withdrawal:");
    console.error(error.message || error);

    if (error.message?.includes('TooEarlyForRelayer')) {
      console.error("\n⏰ The 1-hour waiting period hasn't passed yet.");
    } else if (error.message?.includes('IntentAlreadyExecuted')) {
      console.error("\n⚠️  This intent has already been executed!");
    } else if (error.message?.includes('IntentNotFound')) {
      console.error("\n⚠️  Intent not found. Check the intentHash.");
    }

    process.exit(1);
  }
}

main();

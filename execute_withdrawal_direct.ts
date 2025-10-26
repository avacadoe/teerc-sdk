import { createWalletClient, createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract ABI - just the executeWithdrawIntent function
const EXECUTE_WITHDRAW_INTENT_ABI = [{
  name: "executeWithdrawIntent",
  type: "function",
  stateMutability: "nonpayable",
  inputs: [
    { name: "intentHash", type: "bytes32" },
    { name: "tokenId", type: "uint256" },
    { name: "destination", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    {
      name: "proof",
      type: "tuple",
      components: [
        {
          name: "proofPoints",
          type: "tuple",
          components: [
            { name: "a", type: "uint256[2]" },
            { name: "b", type: "uint256[2][2]" },
            { name: "c", type: "uint256[2]" }
          ]
        },
        { name: "publicSignals", type: "uint256[16]" }
      ]
    },
    { name: "balancePCT", type: "uint256[7]" },
    { name: "intentMetadata", type: "bytes" }
  ],
  outputs: []
}] as const;

// Intent parameters from transaction 0x103fa11f30a3e5d3243284fce8323ccbca6565c0a73a0700162b2a1543f90263
const intentHash = "0x1982ee5796a1c70842f7a933130d2d1760046baddce62c9b7176f6810acf439a";
const tokenId = 1n; // Using tokenId 1 (TEST token)
const amount = 100n;
const destination = "0xE6670193988c10D8C1460F118B6223244a4f558A";
const nonce = 1n;

const proof = {
  proofPoints: {
    a: [
      "0x17459b0fe403e5ef05b78c597fb96d5c2f1851487da421da25386e55b2b09c07",
      "0x2f7b22cfc21ec978ccc23a8d6bdce3cd70481a9117dd6ce6e8e2ddee3b139ba6"
    ],
    b: [
      [
        "0x2ab7e95fa29191f00d286e21c3070900b2a592989f78f71e943eef92bb67884d",
        "0x2ce36f6a9120455112f7b678ca0937baf7435cda9d6e76ba0800fa0aaaf308e0"
      ],
      [
        "0x22ee1fdf5ef9debdb4cded77ff5698319f3a3b76f9b51cab4bce879a99f0cc95",
        "0x280ab7f0a055e6de46f0be2791794c96503f4565462574765b9c59c47af293a7"
      ]
    ],
    c: [
      "0x09a280ca8e7c1ee92686aac0637262b7bef0de720f5422db0accfb90762c4bba",
      "0x2bbb8a060e3d33078a8b01bc406b8cc4e5719047433d26754e3549fa3f30bbc8"
    ]
  },
  publicSignals: [
    "0x0fd68e06a5a218cb2cdaa39ce8dd9d9e50b374b2e1faa90ae16a116485184bc7",
    "0x1dc646d171166637d5ebaa6bd2a801ff4513043f01f9cd6a1a586fdac71adf89",
    "0x00e40906de303ca22e43cdc8ca76d11b13c5a3ef20f266b444a47e6af6d3fd71",
    "0x0bbe5facc80dc90b3c0a162000ac5be401c70f7dcf258ba65e94cb35792de912",
    "0x239e3fa02802905fa75ee126d1bbc65effc94fb729fde2224836a8a1add8f374",
    "0x02790110f1121ddf8f61edab1c6d4bf451dba88d0d61ecad94b04578559bed2c",
    "0x0fd68e06a5a218cb2cdaa39ce8dd9d9e50b374b2e1faa90ae16a116485184bc7",
    "0x1dc646d171166637d5ebaa6bd2a801ff4513043f01f9cd6a1a586fdac71adf89",
    "0x19f2d001203b95c23ad9c530ecd16f65b190275795e7697abbeb797b14f15c50",
    "0x272a00ae676650e5425a1658b59bc57367ed5d44a943567e28d1b8e8795d65ab",
    "0x11b249c3fa5490ce49aa7993ad2fd69a62dab4226d18cbfd52f2502f42fc9760",
    "0x0f48d00355758e11dcc64a258604c8e978972c08b2204b16b0569d04fe95815b",
    "0x2eb0fd9030aa1bf27cd31931c2c95dae4cc7cd2be15d03e3e1fda616211ea416",
    "0x146af66e3199108743fec90ee6d2fe9f10fc885b700c0a548fb434c344f411bd",
    "0x00000000000000000000000000000000d59660e22b82775dc3273e34d97f8cc3",
    "0x1982ee5796a1c70842f7a933130d2d1760046baddce62c9b7176f6810acf439a"
  ]
};

const balancePCT = [
  "0x19d63cb2ad80ad5640132367dc56258f4cc1938e1e79e7fce0f19bee2e3955ab",
  "0x03cd8f90b38127f614154ca9dea6ea27fad63e94ec37b1498fff9e96d08303db",
  "0x0176cf7af12c09c2bdfa37ab1eab979e9769218e68fa1a67ca6a61f73e851948",
  "0x076de4e3de0d7d19e70a3097f5d9e36bf90f3321ef49a595e038fb4c6e2fd266",
  "0x098bebba5af8e851a267604aedfe17131a1305d623c7daed65c9ebede224cdf5",
  "0x2c028d47b09266dc56af3aeb2da642c65c3f81a0416504e18d4cdd2916dc25ff",
  "0x000000000000000000000000000000008429b715ec5f4798fca3f732bdbeb912"
];

const metadata = "0x";

// Contract address
const CONTRACT_ADDRESS = '0x5894792d827D56057718Ca15B266D1A7C4eb3682';

// Private key
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ Please set PRIVATE_KEY environment variable");
    process.exit(1);
  }

  console.log("🚀 Executing withdrawal intent directly...\n");

  // Create account and clients
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

  console.log("👤 Executing from:", account.address);
  console.log("\n📋 Intent Details:");
  console.log("  Intent Hash:", intentHash);
  console.log("  Token ID:", tokenId.toString());
  console.log("  Amount:", amount.toString());
  console.log("  Destination:", destination);
  console.log("  Nonce:", nonce.toString());
  console.log("\n⏳ Submitting transaction...\n");

  try {
    // Call the contract directly
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: EXECUTE_WITHDRAW_INTENT_ABI,
      functionName: 'executeWithdrawIntent',
      args: [
        intentHash as `0x${string}`,
        tokenId,
        destination as `0x${string}`,
        amount,
        nonce,
        proof,
        balancePCT,
        metadata as `0x${string}`
      ]
    });

    console.log("✅ Transaction submitted!");
    console.log("\n📝 Transaction Hash:", hash);
    console.log("\n⏳ Waiting for confirmation...");

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log("\n🎉 SUCCESS! Withdrawal executed!");
      console.log("\n🔗 View on Explorer:");
      console.log(`   https://testnet.snowtrace.io/tx/${hash}`);
    } else {
      console.log("\n❌ Transaction failed!");
      console.log("Receipt:", receipt);
    }
  } catch (error: any) {
    console.error("\n❌ Error executing withdrawal:");
    console.error(error.shortMessage || error.message || error);

    if (error.message?.includes('TooEarlyForRelayer') || error.message?.includes('TooEarlyForPermissionless')) {
      console.error("\n⏰ The required waiting period hasn't passed yet.");
    } else if (error.message?.includes('IntentAlreadyExecuted')) {
      console.error("\n⚠️  This intent has already been executed!");
    } else if (error.message?.includes('IntentNotFound')) {
      console.error("\n⚠️  Intent not found. Check the intentHash.");
    }

    process.exit(1);
  }
}

main();

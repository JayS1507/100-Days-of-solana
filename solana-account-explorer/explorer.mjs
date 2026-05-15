import {
  createSolanaRpc,
  address,
} from "@solana/kit";

// Devnet RPC
const rpc = createSolanaRpc("https://api.devnet.solana.com");

// Get address from command line
const inputAddress = process.argv[2];

// Check if address exists
if (!inputAddress) {
  console.log("Usage:");
  console.log("node explorer.mjs <SOLANA_ADDRESS>");
  process.exit(1);
}

// Known program names
const KNOWN_PROGRAMS = {
  "11111111111111111111111111111111": "System Program",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "SPL Token Program",
  "Stake11111111111111111111111111111111111111": "Stake Program",
  "Vote111111111111111111111111111111111111111": "Vote Program",
  "BPFLoaderUpgradeab1e11111111111111111111111":
    "Upgradeable BPF Loader",
};

async function exploreAccount() {
  try {
    const pubkey = address(inputAddress);

    // Get balance
    const balanceResponse = await rpc.getBalance(pubkey).send();

    // Get account info
    const accountInfo = await rpc.getAccountInfo(pubkey).send();

    // Convert lamports to SOL
    const solBalance = Number(balanceResponse.value) / 1_000_000_000;

    console.log("\n==============================");
    console.log(" SOLANA ACCOUNT EXPLORER");
    console.log("==============================\n");

    console.log("Address:");
    console.log(inputAddress);

    console.log("\nBalance:");
    console.log(`${solBalance} SOL`);

    if (!accountInfo.value) {
      console.log("\nAccount not found.");
      return;
    }

    const owner = accountInfo.value.owner;

    console.log("\nOwner:");
    console.log(KNOWN_PROGRAMS[owner] || owner);

    console.log("\nExecutable:");
    console.log(accountInfo.value.executable);

    console.log("\nRent Epoch:");
    console.log(accountInfo.value.rentEpoch);

    console.log("\nData Length:");
    console.log(accountInfo.value.data.length, "bytes");

    // Show truncated data preview
    let dataPreview = "";

    if (typeof accountInfo.value.data === "string") {
      dataPreview = accountInfo.value.data.slice(0, 100);
    } else {
      dataPreview = JSON.stringify(accountInfo.value.data).slice(0, 100);
    }

    console.log("\nData Preview:");
    console.log(dataPreview || "No Data");

    console.log("\n==============================\n");

  } catch (error) {
    console.error("Error:");
    console.error(error.message);
  }
}

exploreAccount();

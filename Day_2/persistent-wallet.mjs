import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { readFile, writeFile } from "fs/promises";

const WALLET_FILE = "wallet.json";
const connection = new Connection("https://api.devnet.solana.com");

// Load or create wallet
async function loadOrCreateWallet() {
  try {
    // Load existing wallet
    const data = JSON.parse(await readFile(WALLET_FILE, "utf-8"));
    const secretKey = Uint8Array.from(data.secretKey);
    const wallet = Keypair.fromSecretKey(secretKey);

    console.log("Loaded existing wallet:", wallet.publicKey.toString());
    return wallet;
  } catch {
    // Create new wallet
    const wallet = Keypair.generate();

    await writeFile(
      WALLET_FILE,
      JSON.stringify({
        secretKey: Array.from(wallet.secretKey),
      })
    );

    console.log("Created new wallet:", wallet.publicKey.toString());
    console.log("Saved to wallet.json");

    return wallet;
  }
}

const wallet = await loadOrCreateWallet();

// Check balance
const balance = await connection.getBalance(wallet.publicKey);
const sol = balance / 1_000_000_000;

console.log("\nAddress:", wallet.publicKey.toString());
console.log("Balance:", sol, "SOL");

if (sol === 0) {
  console.log("\n⚠️ No SOL found. Airdrop from faucet:");
  console.log(wallet.publicKey.toString());
}

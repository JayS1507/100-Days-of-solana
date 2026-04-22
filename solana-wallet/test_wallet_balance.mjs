import { Connection, PublicKey } from "@solana/web3.js";

// 🔁 Replace this with YOUR wallet address
const address = new PublicKey("CwZkXMyBFYcxZJK9oXpYbNjnANp71MA9V4HrCunzEATq");

// Connect to Devnet
const connection = new Connection("https://api.devnet.solana.com");

// Get balance
const balance = await connection.getBalance(address);

// Convert lamports → SOL
const sol = balance / 1_000_000_000;

console.log("Wallet Address:", address.toString());
console.log("Balance:", sol, "SOL");

import { Keypair } from "@solana/web3.js";

// Generate new wallet
const wallet = Keypair.generate();

console.log("Your wallet address:", wallet.publicKey.toString());
console.log("Private key (secret):", wallet.secretKey);

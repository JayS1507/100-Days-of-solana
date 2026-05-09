import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";

import {
	address,
	createKeyPairSignerFromBytes,
	createSolanaRpc,
	createSolanaRpcSubscriptions,
	pipe,
	createTransactionMessage,
	setTransactionMessageFeePayerSigner,
	setTransactionMessageLifetimeUsingBlockhash,
	appendTransactionMessageInstruction,
	signTransactionMessageWithSigners,
	getSignatureFromTransaction,
	getBase64EncodedWireTransaction,
	lamports,
	devnet,
} from "@solana/kit";

import { getTransferSolInstruction } from "@solana-program/system";

// --- Configuration ---
const RPC_URL = devnet("https://api.devnet.solana.com");
const WS_URL = devnet("wss://api.devnet.solana.com");

const LAMPORTS_PER_SOL = 1_000_000_000n;

// --- Parse arguments ---
const args = process.argv.slice(2);

if (args.length < 2) {
	console.error("Usage: node transfer.mjs <RECIPIENT_ADDRESS> <AMOUNT_IN_SOL>");
	process.exit(1);
}

const recipientAddress = address(args[0]);
const solAmount = parseFloat(args[1]);

if (isNaN(solAmount) || solAmount <= 0) {
	console.error("Amount must be positive");
	process.exit(1);
}

const transferLamports = lamports(
	BigInt(Math.round(solAmount * Number(LAMPORTS_PER_SOL)))
);

// --- Load keypair ---
async function loadKeypair() {
	const keypairPath = resolve(homedir(), ".config", "solana", "id.json");

	const secretKeyJson = await readFile(keypairPath, "utf8");

	const secretKeyBytes = new Uint8Array(JSON.parse(secretKeyJson));

	return await createKeyPairSignerFromBytes(secretKeyBytes);
}

// --- Status UI ---
function statusUpdate(message) {
	process.stdout.clearLine(0);
	process.stdout.cursorTo(0);
	process.stdout.write(message);
}

// --- Wait for commitment ---
async function waitForCommitment(rpc, signature, targetCommitment) {
	while (true) {
		const response = await rpc
			.getSignatureStatuses([signature])
			.send();

		const status = response.value[0];

		if (status?.err) {
			throw new Error(JSON.stringify(status.err));
		}

		if (status?.confirmationStatus === targetCommitment) {
			return;
		}

		if (
			targetCommitment === "confirmed" &&
			(status?.confirmationStatus === "confirmed" ||
				status?.confirmationStatus === "finalized")
		) {
			return;
		}

		if (
			targetCommitment === "processed" &&
			status?.confirmationStatus
		) {
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}
}

// --- Transfer with tracking ---
async function transferWithConfirmation(
	rpc,
	sender,
	recipientAddress,
	solAmount
) {
	const { value: latestBlockhash } =
		await rpc.getLatestBlockhash().send();

	const transactionMessage = pipe(
		createTransactionMessage({ version: 0 }),
		(tx) => setTransactionMessageFeePayerSigner(sender, tx),
		(tx) =>
			setTransactionMessageLifetimeUsingBlockhash(
				latestBlockhash,
				tx
			),
		(tx) =>
			appendTransactionMessageInstruction(
				getTransferSolInstruction({
					source: sender,
					destination: recipientAddress,
					amount: transferLamports,
				}),
				tx
			)
	);

	const signedTransaction =
		await signTransactionMessageWithSigners(
			transactionMessage
		);

	const signature =
		getSignatureFromTransaction(signedTransaction);

        const wireTransaction =
	getBase64EncodedWireTransaction(signedTransaction);

// Send transaction
      statusUpdate("📤 Sending transaction...");

await rpc.sendTransaction(wireTransaction, {
	encoding: "base64",
}).send();
	// Processed
	await waitForCommitment(rpc, signature, "processed");
	statusUpdate("🟡 Transaction processed...");

	// Confirmed
	await waitForCommitment(rpc, signature, "confirmed");
	statusUpdate("🟢 Transaction confirmed...");

	// Finalized
	await waitForCommitment(rpc, signature, "finalized");
	statusUpdate("✅ Transaction finalized!\n");

	return signature;
}

// --- Main ---
async function main() {
	console.log("Solana Transfer Tool");
	console.log("====================\n");

	const rpc = createSolanaRpc(RPC_URL);

	createSolanaRpcSubscriptions(WS_URL);

	console.log("Connected to Solana devnet.\n");

	const sender = await loadKeypair();

	console.log("Sender:", sender.address);
	console.log("Recipient:", recipientAddress.toString());
	console.log("Amount:", solAmount, "SOL\n");

	const { value: balance } =
		await rpc.getBalance(sender.address).send();

	const balanceInSol =
		Number(balance) / Number(LAMPORTS_PER_SOL);

	console.log(`Sender balance: ${balanceInSol} SOL`);

	if (balance < transferLamports) {
		console.error(
			`Insufficient funds. Need at least ${solAmount} SOL`
		);

		process.exit(1);
	}

	try {
		const signature =
			await transferWithConfirmation(
				rpc,
				sender,
				recipientAddress,
				solAmount
			);

		console.log("\nTransaction successful!");
		console.log(`Signature: ${signature}`);

		console.log(
			`https://explorer.solana.com/tx/${signature}?cluster=devnet`
		);
	} catch (error) {
		console.error("\nTransaction failed:");
		console.error(error.message);

		process.exit(1);
	}
}

main();

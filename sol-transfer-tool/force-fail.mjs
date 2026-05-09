import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";

import {
	createSolanaRpc,
	createTransactionMessage,
	setTransactionMessageFeePayerSigner,
	setTransactionMessageLifetimeUsingBlockhash,
	appendTransactionMessageInstruction,
	signTransactionMessageWithSigners,
	getBase64EncodedWireTransaction,
	createKeyPairSignerFromBytes,
	address,
	pipe,
	lamports,
	devnet,
} from "@solana/kit";

import { getTransferSolInstruction } from "@solana-program/system";

const RPC_URL = devnet("https://api.devnet.solana.com");

async function loadKeypair() {
	const keypairPath = resolve(
		homedir(),
		".config",
		"solana",
		"id.json"
	);

	const secretKeyJson = await readFile(
		keypairPath,
		"utf8"
	);

	const secretKeyBytes = new Uint8Array(
		JSON.parse(secretKeyJson)
	);

	return await createKeyPairSignerFromBytes(
		secretKeyBytes
	);
}

async function main() {
	const rpc = createSolanaRpc(RPC_URL);

	const sender = await loadKeypair();

	console.log("Sender:", sender.address);

	// Intentionally impossible amount
	const transferAmount = lamports(
		999999999999999999n
	);

	// Send to random address
	const recipient = address(
		"54KAFegHCj6Zd2U7vsQQBX2z2r4zWGrs5QvLRxTuAzjd"
	);

	const { value: latestBlockhash } =
		await rpc.getLatestBlockhash().send();

	const transactionMessage = pipe(
		createTransactionMessage({ version: 0 }),
		(tx) =>
			setTransactionMessageFeePayerSigner(
				sender,
				tx
			),
		(tx) =>
			setTransactionMessageLifetimeUsingBlockhash(
				latestBlockhash,
				tx
			),
		(tx) =>
			appendTransactionMessageInstruction(
				getTransferSolInstruction({
					source: sender,
					destination: recipient,
					amount: transferAmount,
				}),
				tx
			)
	);

	const signedTransaction =
		await signTransactionMessageWithSigners(
			transactionMessage
		);

	const wireTransaction =
		getBase64EncodedWireTransaction(
			signedTransaction
		);

	console.log(
		"\nSending intentionally failing transaction..."
	);

	const signature = await rpc
		.sendTransaction(wireTransaction, {
			encoding: "base64",
			skipPreflight: true,
		})
		.send();

	console.log("\nFailed Transaction Signature:");
	console.log(signature);

	console.log(
		`\nExplorer:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
	);
}

main().catch((err) => {
	console.error("\nError:");
	console.error(err);
});

import {
  createSolanaRpc,
  address,
  getBase58Encoder,
} from "@solana/kit";

import {
  getMintDecoder,
} from "@solana-program/token";

// Wrapped SOL Mint
const MINT_ADDRESS =
  "So11111111111111111111111111111111111111112";

// Mainnet RPC
const rpc = createSolanaRpc(
  "https://api.mainnet-beta.solana.com"
);

async function decodeMint() {
  try {
    console.log("\n==============================");
    console.log(" FETCHING ACCOUNT DATA");
    console.log("==============================\n");

    const mintPubkey = address(MINT_ADDRESS);

    // RAW ACCOUNT INFO
    const accountInfo = await rpc
      .getAccountInfo(mintPubkey, {
        encoding: "base64",
      })
      .send();

    if (!accountInfo.value) {
      console.log("Mint not found");
      return;
    }

    const rawData = accountInfo.value.data[0];

    console.log("Owner:");
    console.log(accountInfo.value.owner);

    console.log("\nRaw Data Length:");
    console.log(rawData.length);

    // Convert base64 → bytes
    const rawBytes = Buffer.from(rawData, "base64");

    console.log("\n==============================");
    console.log(" CODEC DECODE");
    console.log("==============================\n");

    // SPL Token codec decode
    const mintDecoder = getMintDecoder();

    const decodedMint = mintDecoder.decode(rawBytes);

    console.log(decodedMint);

    console.log("\n==============================");
    console.log(" MANUAL BYTE DECODE");
    console.log("==============================\n");

    const view = new DataView(
      rawBytes.buffer,
      rawBytes.byteOffset,
      rawBytes.byteLength
    );

    // Manual decoding
    const mintAuthorityOption =
      view.getUint32(0, true);

    const mintAuthorityBytes =
      rawBytes.slice(4, 36);

    const supply =
      view.getBigUint64(36, true);

    const decimals =
      view.getUint8(44);

    const isInitialized =
      view.getUint8(45);

    const freezeAuthorityOption =
      view.getUint32(46, true);

    const freezeAuthorityBytes =
      rawBytes.slice(50, 82);

    const base58 = getBase58Encoder();

    console.log("Mint Authority Option:");
    console.log(mintAuthorityOption);

    console.log("\nMint Authority:");
    console.log(
      base58.encode(mintAuthorityBytes)
    );

    console.log("\nSupply:");
    console.log(supply.toString());

    console.log("\nDecimals:");
    console.log(decimals);

    console.log("\nInitialized:");
    console.log(Boolean(isInitialized));

    console.log("\nFreeze Authority Option:");
    console.log(freezeAuthorityOption);

    console.log("\nFreeze Authority:");
    console.log(
      base58.encode(freezeAuthorityBytes)
    );

    console.log("\n==============================");
    console.log(" RPC JSON PARSED");
    console.log("==============================\n");

    // JSON parsed version
    const parsed = await rpc
      .getAccountInfo(mintPubkey, {
        encoding: "jsonParsed",
      })
      .send();

    console.log(
      JSON.stringify(
        parsed.value.data,
        null,
        2
      )
    );

    console.log("\n==============================\n");

  } catch (error) {
    console.error(error);
  }
}

decodeMint();

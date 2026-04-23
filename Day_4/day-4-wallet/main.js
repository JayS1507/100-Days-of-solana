import {
  Connection,
  clusterApiUrl,
  PublicKey
} from "@solana/web3.js";

import { getWallets } from "@wallet-standard/app";

const connection = new Connection(
  clusterApiUrl("devnet")
);

const walletListDiv =
  document.getElementById("wallet-list");

const connectedDiv =
  document.getElementById("connected");

const statusDiv =
  document.getElementById("status");

const errorDiv =
  document.getElementById("error");

let connectedWallet = null;

function isSolanaWallet(wallet) {
  return wallet.chains?.some((chain) =>
    chain.startsWith("solana:")
  );
}

function renderWalletList(wallets) {
  const solanaWallets =
    wallets.filter(isSolanaWallet);

  if (solanaWallets.length === 0) {
    walletListDiv.innerHTML = `
      <div>
        No Solana wallets found
      </div>
    `;
    return;
  }

  statusDiv.textContent =
    `Found ${solanaWallets.length} wallet(s):`;

  walletListDiv.innerHTML = "";

  for (const wallet of solanaWallets) {
    const btn =
      document.createElement("button");

    btn.className = "wallet-btn";

    btn.innerHTML = wallet.icon
      ? `<img src="${wallet.icon}" /> ${wallet.name}`
      : wallet.name;

    btn.addEventListener("click", () =>
      connectWallet(wallet)
    );

    walletListDiv.appendChild(btn);
  }
}

async function connectWallet(wallet) {
  try {
    const connectFeature =
      wallet.features["standard:connect"];

    const { accounts } =
      await connectFeature.connect();

    const account = accounts[0];

    const address = account.address;

    const balance =
      await connection.getBalance(
        new PublicKey(address)
      );

    const sol =
      balance / 1000000000;

    connectedWallet = wallet;

    walletListDiv.style.display =
      "none";

    connectedDiv.style.display =
      "block";

    connectedDiv.innerHTML = `
      <h3>
        Connected to ${wallet.name}
      </h3>

      <div class="address">
        ${address}
      </div>

      <div class="balance">
        ${sol} SOL
      </div>

      <button
        class="disconnect-btn"
        id="disconnectBtn"
      >
        Disconnect
      </button>
    `;

    document
      .getElementById("disconnectBtn")
      .addEventListener("click", () =>
        disconnectWallet(wallet)
      );

  } catch (err) {
    errorDiv.textContent =
      err.message;
  }
}

async function disconnectWallet(wallet) {
  const disconnectFeature =
    wallet.features[
      "standard:disconnect"
    ];

  if (disconnectFeature) {
    await disconnectFeature.disconnect();
  }

  connectedWallet = null;

  connectedDiv.style.display =
    "none";

  walletListDiv.style.display =
    "block";
}

const { get, on } = getWallets();

renderWalletList(get());

on("register", () => {
  if (!connectedWallet) {
    renderWalletList(get());
  }
});

# Crypto Key Utility Website

This is a minimalistic, client-side cryptocurrency key utility website. It allows users to input a cryptographic key (mnemonic, WIF, Hex, Binary) for various cryptocurrencies (BTC, LTC, DOGE, ETH) and derive associated information like private keys in different formats, public keys, and addresses.

All computations are performed locally in the user's browser using JavaScript. No data is sent to any server.

## Features

-   Supports Bitcoin (BTC), Litecoin (LTC), Dogecoin (DOGE), and Ethereum (ETH).
-   Accepts various input key formats:
    -   Mnemonic phrases (BIP39)
    -   Wallet Import Format (WIF)
    -   Hexadecimal private keys
    -   Binary private keys
-   Allows users to specify a coin prefix.
-   Auto-detects input key type or allows manual selection.
-   Supports derivation path input for mnemonic phrases (e.g., BIP44, BIP49, BIP84 for BTC/LTC; standard ETH path).
-   Displays derived information:
    -   Private keys (Hex, WIF)
    -   Public keys (Compressed, Uncompressed Hex)
    -   Addresses (P2PKH, P2SH-P2WPKH, P2WPKH Bech32 for BTC/LTC; standard address for DOGE/ETH)
    -   BIP32 information (Root Key, Extended Private/Public Keys) when derived from mnemonic.
-   Minimalistic and responsive UI.

## Files Included

-   `index.html`: The main HTML file for the website.
-   `style.css`: CSS file for styling the website.
-   `script.js`: JavaScript file containing the core logic and interactions.
-   `ethers.js`: The Ethers.js library (v5.7.2 UMD) for Ethereum operations.
-   `bitcoinjs-lib.js`: The BitcoinJS library (v6.1.5 UMD) for Bitcoin and Litecoin operations.
-   `bitcore-lib-doge.js`: The Bitcore Doge library (v10.9.0 UMD) for Dogecoin operations.

## How to Use / Deploy

1.  **Local Usage:**
    -   Download all the files (`index.html`, `style.css`, `script.js`, `ethers.js`, `bitcoinjs-lib.js`, `bitcore-lib-doge.js`) into a single folder on your computer.
    -   Open `index.html` in your web browser.

2.  **GitHub Pages Deployment:**
    -   Create a new GitHub repository.
    -   Upload all the files (`index.html`, `style.css`, `script.js`, `ethers.js`, `bitcoinjs-lib.js`, `bitcore-lib-doge.js`, and this `README.md`) to the repository.
    -   Go to your repository's settings.
    -   Navigate to the "Pages" section in the left sidebar.
    -   Under "Build and deployment", select "Deploy from a branch" as the source.
    -   Choose the branch you uploaded the files to (e.g., `main` or `master`) and the `/ (root)` folder.
    -   Click "Save".
    -   GitHub Pages will build and deploy your site. The URL will be provided on the same page (usually `https://<your-username>.github.io/<repository-name>/`).

## Libraries Used

-   [Ethers.js](https://ethers.io/): For Ethereum-related cryptographic functions.
-   [BitcoinJS (bitcoinjs-lib)](https://github.com/bitcoinjs/bitcoinjs-lib): For Bitcoin and Litecoin cryptographic functions.
-   [Bitcore Lib Doge](https://github.com/bitpay/bitcore-lib-doge): For Dogecoin cryptographic functions.

## Disclaimer

This tool is provided for educational and experimental purposes only. Working with private keys is inherently risky. Always handle your private keys with extreme caution. The author or contributors are not responsible for any loss of funds or damages resulting from the use of this software. **It is strongly recommended to use this tool offline or on a secure, air-gapped computer if dealing with real private keys.**


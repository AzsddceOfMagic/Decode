document.addEventListener("DOMContentLoaded", () => {
    const cryptoPrefixEl = document.getElementById("crypto-prefix");
    const keyInputEl = document.getElementById("key-input");
    const keyTypeEl = document.getElementById("key-type");
    const mnemonicOptionsEl = document.getElementById("mnemonic-options");
    const derivationPathEl = document.getElementById("derivation-path");
    const calculateBtn = document.getElementById("calculate-btn");
    const resultsEl = document.getElementById("results");

    const bitcoin = window.bitcoin;
    const ethers = window.ethers;
    const bitcore = window.bitcore; // Assuming bitcore-lib-doge exposes 'bitcore'

    // Network parameters
    const LITECOIN_NETWORK = {
        messagePrefix: "\x19Litecoin Signed Message:\n",
        bech32: "ltc",
        bip32: {
            public: 0x019da462, // Ltub
            private: 0x019d9cfe, // Ltpv
        },
        pubKeyHash: 0x30, // L
        scriptHash: 0x32, // M or 3
        wif: 0xb0,      // T
    };

    const DOGECOIN_NETWORK_PARAMS_FOR_BITCORE = bitcore.Networks.livenet; // bitcore-lib-doge uses its own network definitions

    keyTypeEl.addEventListener("change", () => {
        mnemonicOptionsEl.style.display = keyTypeEl.value === "mnemonic" ? "block" : "none";
    });

    calculateBtn.addEventListener("click", async () => {
        const prefix = cryptoPrefixEl.value.trim().toUpperCase();
        const keyInput = keyInputEl.value.trim();
        let keyType = keyTypeEl.value;
        const derivationPath = derivationPathEl.value.trim();
        resultsEl.innerHTML = "<p>Processing...</p>";

        if (!prefix || !keyInput) {
            resultsEl.innerHTML = 
                '<p style="color: red;">Error: Coin Prefix and Key Input cannot be empty.</p>';
            return;
        }

        // Basic auto-detection
        if (keyType === 'auto') {
            if (keyInput.split(' ').length >= 12 && keyInput.split(' ').length <= 24) keyType = 'mnemonic';
            else if ((keyInput.length === 51 || keyInput.length === 52) && (keyInput.startsWith('5') || keyInput.startsWith('K') || keyInput.startsWith('L') || keyInput.startsWith('9') || keyInput.startsWith('Q') || keyInput.startsWith('6') || keyInput.startsWith('T'))) keyType = 'wif'; // Basic WIF check
            else if (keyInput.match(/^[0-9a-fA-F]+$/) && keyInput.length === 64) keyType = 'hex';
            else if (keyInput.match(/^(0x)?[0-9a-fA-F]+$/) && (keyInput.length === 66 || keyInput.length === 64)) keyType = 'hex'; // For ETH like keys
            else if (keyInput.match(/^[01]+$/) && keyInput.length === 256) keyType = 'binary';
            else {
                 resultsEl.innerHTML = '<p style="color: red;">Error: Could not auto-detect key type. Please select manually.</p>';
                 return;
            }
            console.log("Auto-detected key type:", keyType);
        }
        
        if (keyType === "mnemonic" && !derivationPath && (prefix === "BTC" || prefix === "LTC" || prefix === "DOGE")) {
             resultsEl.innerHTML = '<p style="color: red;">Error: Derivation path is required for mnemonic on BTC, LTC, DOGE.</p>';
             return;
        }

        try {
            let derivedInfo = {};
            if (!bitcoin && (prefix === "BTC" || prefix === "LTC")) {
                throw new Error("BitcoinJS library not loaded.");
            }
            if (!ethers && prefix === "ETH") {
                throw new Error("Ethers.js library not loaded.");
            }
            if (!bitcore && prefix === "DOGE") {
                throw new Error("Bitcore-lib-doge library not loaded.");
            }

            if (prefix === "BTC") {
                derivedInfo = await processBitcoin(keyInput, keyType, derivationPath, bitcoin.networks.bitcoin);
            } else if (prefix === "LTC") {
                derivedInfo = await processBitcoin(keyInput, keyType, derivationPath, LITECOIN_NETWORK); // Use processBitcoin with LTC network
            } else if (prefix === "DOGE") {
                derivedInfo = await processDogecoin(keyInput, keyType, derivationPath);
            } else if (prefix === "ETH") {
                derivedInfo = await processEthereum(keyInput, keyType, derivationPath);
            } else {
                resultsEl.innerHTML = 
                    '<p style="color: red;">Error: Unsupported coin prefix. Supported: BTC, LTC, DOGE, ETH.</p>';
                return;
            }
            displayResults(derivedInfo, prefix);
        } catch (error) {
            console.error("Calculation error:", error);
            resultsEl.innerHTML = `<p style="color: red;">Error: ${error.message}. Check console for details.</p>`;
        }
    });

    function displayResults(info, prefix) {
        if (Object.keys(info).length === 0) {
            resultsEl.innerHTML = "<p>No information could be derived. Please check your input.</p>";
            return;
        }
        let html = `<h3>${prefix} Derived Information:</h3>`;
        for (const key in info) {
            if (info.hasOwnProperty(key)) {
                html += `<p><strong>${formatKeyName(key)}:</strong> <span style="word-break: break-all;">${escapeHtml(info[key])}</span></p>`;
            }
        }
        resultsEl.innerHTML = html;
    }

    function formatKeyName(key) {
        return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === "undefined") return "";
        return unsafe.toString()
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    async function processBitcoin(keyInput, keyType, derivationPath, network) {
        const ECPair = bitcoin.ECPair;
        const bip39 = bitcoin.bip39;
        const bip32 = bitcoin.bip32;
        let keyPair;
        let results = {};

        if (keyType === "mnemonic") {
            if (!bip39.validateMnemonic(keyInput)) throw new Error("Invalid mnemonic phrase.");
            const seed = bip39.mnemonicToSeedSync(keyInput);
            const root = bip32.fromSeed(seed, network);
            const child = root.derivePath(derivationPath);
            keyPair = ECPair.fromPrivateKey(child.privateKey, { network });
            results.mnemonic = keyInput;
            results.derivationPath = derivationPath;
            results.bip32RootKey = root.toBase58();
            results.bip32ExtendedPrivateKey = child.toBase58();
            results.bip32ExtendedPublicKey = child.neutered().toBase58();
        } else if (keyType === "wif") {
            keyPair = ECPair.fromWIF(keyInput, network);
        } else if (keyType === "hex") {
            const privateKeyBuffer = Buffer.from(keyInput, "hex");
            keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network });
        } else if (keyType === "binary") {
            const hexKey = BigInt("0b" + keyInput).toString(16).padStart(64, '0');
            const privateKeyBuffer = Buffer.from(hexKey, "hex");
            keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network });
        } else {
            throw new Error("Unsupported key type for Bitcoin/Litecoin.");
        }

        results.privateKeyHex = keyPair.privateKey.toString("hex");
        results.privateKeyWIF = keyPair.toWIF();
        results.publicKeyHexCompressed = keyPair.publicKey.toString("hex");
        const uncompressedPublicKey = ECPair.fromPublicKey(keyPair.publicKey, { compressed: false, network }).publicKey;
        results.publicKeyHexUncompressed = uncompressedPublicKey.toString("hex");
        
        // Addresses
        results.addressP2PKH = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address;
        results.addressP2SH_P2WPKH = bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }), network }).address;
        if (network.bech32) { // Only if network supports bech32 (like BTC, LTC)
             results.addressP2WPKH_Bech32 = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address;
        }
        return results;
    }

    async function processDogecoin(keyInput, keyType, derivationPath) {
        let privateKey;
        let results = {};

        if (keyType === "mnemonic") {
            // bitcore-lib-doge uses bitcore-mnemonic
            const Mnemonic = bitcore.Mnemonic;
            if (!Mnemonic.isValid(keyInput)) throw new Error("Invalid mnemonic phrase for Dogecoin.");
            const mnemonic = new Mnemonic(keyInput);
            const hdPrivateKey = mnemonic.toHDPrivateKey(null, DOGECOIN_NETWORK_PARAMS_FOR_BITCORE); // no passphrase, use doge network
            const derivedHdPrivateKey = hdPrivateKey.derive(derivationPath);
            privateKey = derivedHdPrivateKey.privateKey;
            results.mnemonic = keyInput;
            results.derivationPath = derivationPath;
            results.bip32RootKey = hdPrivateKey.toString();
            results.bip32ExtendedPrivateKey = derivedHdPrivateKey.toString();
            results.bip32ExtendedPublicKey = derivedHdPrivateKey.hdPublicKey.toString();
        } else if (keyType === "wif") {
            privateKey = new bitcore.PrivateKey.fromWIF(keyInput, DOGECOIN_NETWORK_PARAMS_FOR_BITCORE);
        } else if (keyType === "hex") {
            privateKey = new bitcore.PrivateKey.fromBuffer(Buffer.from(keyInput, "hex"), DOGECOIN_NETWORK_PARAMS_FOR_BITCORE);
        } else if (keyType === "binary") {
            const hexKey = BigInt("0b" + keyInput).toString(16).padStart(64, '0');
            privateKey = new bitcore.PrivateKey.fromBuffer(Buffer.from(hexKey, "hex"), DOGECOIN_NETWORK_PARAMS_FOR_BITCORE);
        } else {
            throw new Error("Unsupported key type for Dogecoin.");
        }

        const publicKey = privateKey.toPublicKey();
        results.privateKeyHex = privateKey.toString(); // This is hex
        results.privateKeyWIF = privateKey.toWIF();
        results.publicKeyHexCompressed = publicKey.toString(); // Compressed by default
        const uncompressedPublicKey = new bitcore.PublicKey(publicKey.point, { compressed: false, network: DOGECOIN_NETWORK_PARAMS_FOR_BITCORE });
        results.publicKeyHexUncompressed = uncompressedPublicKey.toString();
        results.address = privateKey.toAddress(DOGECOIN_NETWORK_PARAMS_FOR_BITCORE).toString();
        return results;
    }

    async function processEthereum(keyInput, keyType, derivationPath) {
        let wallet;
        let results = {};
        let defaultEthPath = "m/44'/60'/0'/0/0";

        if (keyType === "mnemonic") {
            if (!ethers.utils.isValidMnemonic(keyInput)) throw new Error("Invalid mnemonic phrase for ETH.");
            const path = derivationPath || defaultEthPath;
            try {
                // ethers.Wallet.fromMnemonic directly takes the phrase and path
                const mnemonic = ethers.utils.HDNode.fromMnemonic(keyInput).derivePath(path);
                wallet = new ethers.Wallet(mnemonic.privateKey);
            } catch (e) {
                console.error(e);
                throw new Error("Invalid mnemonic phrase or derivation path for ETH.");
            }
            results.mnemonicPhrase = keyInput;
            results.derivationPathUsed = path;
        } else if (keyType === "hex") {
            const privateKeyValue = keyInput.startsWith("0x") ? keyInput : "0x" + keyInput;
            if (!ethers.utils.isHexString(privateKeyValue, 32)) throw new Error("Invalid hexadecimal private key for ETH (must be 32 bytes).");
            try {
                wallet = new ethers.Wallet(privateKeyValue);
            } catch (e) {
                throw new Error("Invalid hexadecimal private key for ETH.");
            }
        } else if (keyType === "binary") {
            const hexKey = BigInt("0b" + keyInput).toString(16).padStart(64, '0');
            const privateKeyValue = "0x" + hexKey;
             if (!ethers.utils.isHexString(privateKeyValue, 32)) throw new Error("Invalid binary private key for ETH (must be 256 bits).");
            try {
                wallet = new ethers.Wallet(privateKeyValue);
            } catch (e) {
                throw new Error("Invalid binary private key for ETH.");
            }
        } else {
            throw new Error("Unsupported key type for ETH. Use Mnemonic, Hex, or Binary Private Key.");
        }

        results.privateKey = wallet.privateKey;
        results.publicKey = wallet.publicKey; // This is the uncompressed public key, prefixed with 0x04
        results.address = wallet.address;
        if (wallet.mnemonic) { // If wallet was created from mnemonic and path is standard
             results.mnemonicPhrase = wallet.mnemonic.phrase;
             results.mnemonicPath = wallet.mnemonic.path;
        }
        return results;
    }
});


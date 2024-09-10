const {getAddress} = require("@ethersproject/address");

const NETWORK = {
    "mainnet": {
        CHAINID: 1,
        TX_SERVICE_BASE_URL: "https://safe-transaction-mainnet.safe.global",
    },
    "xdai": {
        CHAINID: 100,
        TX_SERVICE_BASE_URL: "https://safe-transaction-gnosis-chain.safe.global",
    },
    "matic": {
        CHAINID: 137,
        TX_SERVICE_BASE_URL: "https://safe-transaction-polygon.safe.global",
    },
    "binance": {
        CHAINID: 56,
        TX_SERVICE_BASE_URL: "https://safe-transaction-bsc.safe.global",
    },
    "arbitrum": {
        CHAINID: 42161,
        TX_SERVICE_BASE_URL: "https://safe-transaction-arbitrum.safe.global",
    },
    "fantom": {
        CHAINID: 250,
        TX_SERVICE_BASE_URL: "https://safe.fantom.network",
    },
    "optimism": {
        CHAINID: 10,
        TX_SERVICE_BASE_URL: "https://safe-transaction-optimism.safe.global",
    },
    "avalanche": {
        CHAINID: 43114,
        TX_SERVICE_BASE_URL: "https://safe-transaction-avalanche.safe.global",
    },
    "evmos": {
        CHAINID: 9001,
        TX_SERVICE_BASE_URL: "https://transaction.safe.evmos.org",
    },
    "aurora": {
        CHAINID: 1313161554,
        TX_SERVICE_BASE_URL: "https://safe-transaction-aurora.safe.global",
    },
    "zkevm": {
        CHAINID: 1101,
        TX_SERVICE_BASE_URL: "https://safe-transaction-zkevm.safe.global",
    },
    "sepolia": {
        CHAINID: 11155111,
        TX_SERVICE_BASE_URL: "https://safe-transaction-sepolia.safe.global",
    },
    "baseSepolia": {
        CHAINID: 84532,
        TX_SERVICE_BASE_URL: 'https://safe-transaction-base-sepolia.safe.global',
    }
}

function getSupportedChainID() {
    let chainIDList = [], chainID2Entry = {};
    for (const [key, value] of Object.entries(NETWORK)) {
        chainID2Entry[value.CHAINID] = key;
        chainIDList.push(value.CHAINID);
    }
    return [chainIDList, chainID2Entry];
}

function getTxServiceBaseURL(entry) {
    return NETWORK[entry].TX_SERVICE_BASE_URL;
}

function adjustV(signature) {
    const MIN_VALID_V_VALUE = 27
    let sigV = parseInt(signature.slice(-2), 16);
    if (sigV < MIN_VALID_V_VALUE) {
        sigV += MIN_VALID_V_VALUE
    }
    return signature.slice(0, -2) + sigV.toString(16)
}

function getChecksumAddress(address) {
    return getAddress(address.toLowerCase())
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function reloadPage(chainId) {
    window.location.reload();
}

export default {getSupportedChainID, getTxServiceBaseURL, adjustV, getChecksumAddress, capitalizeFirstLetter, reloadPage};

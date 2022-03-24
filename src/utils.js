const {getAddress} = require("@ethersproject/address");

const NETWORK = {
    "mainnet": {
        CHAINID: 1,
        TX_SERVICE_BASE_URL: "https://safe-transaction.mainnet.gnosis.io",
    },
    "rinkeby": {
        CHAINID: 4,
        TX_SERVICE_BASE_URL: "https://safe-transaction.rinkeby.gnosis.io",
    },
    "goerli": {
        CHAINID: 5,
        TX_SERVICE_BASE_URL: "https://safe-transaction.goerli.gnosis.io",
    },
    "xdai": {
        CHAINID: 100,
        TX_SERVICE_BASE_URL: "https://safe-transaction.xdai.gnosis.io",
    },
    "matic": {
        CHAINID: 137,
        TX_SERVICE_BASE_URL: "https://safe-transaction.polygon.gnosis.io",
    },
    "binance": {
        CHAINID: 56,
        TX_SERVICE_BASE_URL: "https://safe-transaction.bsc.gnosis.io",
    },
    "arbitrum": {
        CHAINID: 42161,
        TX_SERVICE_BASE_URL: "https://safe-transaction.arbitrum.gnosis.io",
    },
    "fantom": {
        CHAINID: 250,
        TX_SERVICE_BASE_URL: "https://safe.fantom.network",
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

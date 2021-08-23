import React, {Component} from "react";
import {Button, Card, Divider, Dot, EthHashInfo, Table, Text, TextField, Title} from "@gnosis.pm/safe-react-components";
import {InjectedConnector} from "@web3-react/injected-connector";
import {useWeb3React} from '@web3-react/core';
import "./App.css"

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
        TX_SERVICE_BASE_URL: "https://safe-transaction.bsc.gnosis.io"
    }
}

const CHAINID = NETWORK[process.env.REACT_APP_CHAIN].CHAINID;
const TX_SERVICE_BASE_URL = NETWORK[process.env.REACT_APP_CHAIN].TX_SERVICE_BASE_URL;

const injectedConnector = new InjectedConnector({ supportedChainIds: [CHAINID] });

function withUseWeb3React(Component) {
    return function WrappedComponent(props) {
        const values = useWeb3React();
        return <Component {...props} web3ReactHookValue={values} />;
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connector: null,
            connected: false,
            safe_account: "",
            safe_accounts: [],
            temp_safe_account: "",
            delegates: null,
            add_delegate: "",
            add_label: "",
            remove_delegate: "",
        };

        this.connectWalletMetamask = this.connectWalletMetamask.bind(this);
        this.connectWallet = this.connectWallet.bind(this);

        this.getSafeAddress = this.getSafeAddress.bind(this);

        this.getConnectView = this.getConnectView.bind(this);
        this.fetchDelegates = this.fetchDelegates.bind(this);
        this.addDelegate = this.addDelegate.bind(this);
        this.removeDelegate = this.removeDelegate.bind(this);

        this.getDelegatesView = this.getDelegatesView.bind(this);
    }


    async connectWalletMetamask() {
        this.state.connector = injectedConnector;
        await this.connectWallet()
    }


    async connectWallet() {
        const web3ReactValue = this.props.web3ReactHookValue;
        web3ReactValue.activate(this.state.connector, undefined, true)
            .then((r) => {
                this.state.connector.getAccount().then((account) => {
                    this.setState({connected: true});
                }).catch((e) => {console.log(e)});
            }).catch((e) => {console.log(e)});
    }

    getConnectView() {
        let connectAction;
        if (this.state.connected) {
            connectAction = <EthHashInfo hash={this.props.web3ReactHookValue.account} showIdenticon showCopyBtn name="Your Wallet Address"/>
        } else {
            connectAction = (
                <>
                    <Button onClick={this.connectWalletMetamask} size="md" iconType="unlocked" color="secondary" variant="bordered" iconSize="sm">
                        <Text size="xl" color="secondary">
                            Connect to Metamask
                        </Text>
                    </Button>
                </>
            )
        }
        return connectAction;
    }

    async fetchDelegates() {
        const account = this.state.safe_account;
        fetch(`${TX_SERVICE_BASE_URL}/api/v1/safes/${account}/delegates/`)
            .then((response) => response.json())
            .then(data => this.setState({delegates: data}))
    }

    adjustV(signature) {
        const MIN_VALID_V_VALUE = 27
        let sigV = parseInt(signature.slice(-2), 16);
        if (sigV < MIN_VALID_V_VALUE) {
            sigV += MIN_VALID_V_VALUE
        }
        return signature.slice(0, -2) + sigV.toString(16)
    }

    async addDelegate() {
        const account = this.state.safe_account;
        const delegate = this.state.add_delegate;
        const label = this.state.add_label;

        const totp = Math.floor(Date.now() / 1000 / 3600);
        const message = delegate + totp;
        this.props.web3ReactHookValue.library.getSigner(this.props.web3ReactHookValue.account).signMessage(message)
            .then((signature) => {
                signature = this.adjustV(signature);
                const requestOptions = {
                    method: 'POST',
                    headers: { 'Content-type': 'application/json' },
                    body: JSON.stringify({
                        "safe": account,
                        "delegate": delegate,
                        "signature": signature,
                        "label": label
                    })
                };
                fetch(`${TX_SERVICE_BASE_URL}/api/v1/safes/${account}/delegates/`, requestOptions)
                    .then(response => response.json())
                    .then(data => {
                        this.setState({"add_delegate": "", "add_label": ""})
                        this.fetchDelegates();
                    });
            }).catch((e) => {console.log(e);})
    }

    async removeDelegate() {
        const account = this.state.safe_account;
        const delegate = this.state.remove_delegate;

        const totp = Math.floor(Date.now() / 1000 / 3600);
        const message = delegate + totp;
        this.props.web3ReactHookValue.library.getSigner(this.props.web3ReactHookValue.account).signMessage(message)
            .then((signature) => {
                signature = this.adjustV(signature);
                const requestOptions = {
                    method: 'DELETE',
                    headers: { 'Content-type': 'application/json' },
                    body: JSON.stringify({
                        "signature": signature
                    })
                };
                fetch(`${TX_SERVICE_BASE_URL}/api/v1/safes/${account}/delegates/${delegate}/`, requestOptions)
                    .then(response => {
                        this.setState({"remove_delegate": ""})
                        this.fetchDelegates();
                    })
            }).catch((e) => {console.log(e);})
    }

    async getSafeAddress() {
        if (!this.state.connector) {
            alert("You need to firtsly connect to your wallet.");
            return
        }
        fetch(`${TX_SERVICE_BASE_URL}/api/v1/owners/${this.props.web3ReactHookValue.account}/safes/`)
            .then(response => response.json())
            .then(data => {
                this.setState({"safe_accounts": data.safes});
            })
    }

    getConfigureSafeAddressView() {
        const headerCells = [
            {id: "address", label: "Safe Address"},
            {id: "action", label: "Action"},
        ]
        const rows = [];
        let index = 0
        for (const obj of this.state.safe_accounts) {
            rows.push({
                id: index++,
                cells:[
                    {id: "address", content: <Text size="xl">{obj}</Text>},
                    {id: "action", content: (
                            <Button onClick={(e) => {console.log(e.target); this.setState({safe_account: `${obj}`});}} size="md" iconType="received" color="secondary" variant="bordered" iconSize="sm">
                                <Text size="xl" color="secondary">
                                    Use This Address
                                </Text>
                            </Button>
                        )},
                ]
            })
        }
        return (
            <Card className="card">
                <Dot color="primary">
                    <Text size="xl" color="white">
                        3
                    </Text>
                </Dot>
                <Title size="xs">Configure your Gnosis Safe address</Title>
                <Text size="xl" style={{marginBottom: "20px"}}>Safes must be owned by your wallet account.</Text>
                <Divider/>
                <EthHashInfo hash={this.state.safe_account} showIdenticon showCopyBtn name="Your Safe Address"/>
                <br/>
                <Table headers={headerCells} rows={rows} />
                <Button onClick={this.getSafeAddress} style={{marginTop: "20px"}} size="md" iconType="received" color="secondary" variant="bordered" iconSize="sm">
                    <Text size="xl" color="secondary">
                        Get All My Safes
                    </Text>
                </Button>
            </Card>
        );
    }

    getDelegatesView() {
        const headerCells = [
            {id: "delegate", label: "Delegate"},
            {id: "delegator", label: "Delegator"},
            {id: "label", label: "Label"}
        ]
        const rows = [];
        if (this.state.delegates != null) {
            let index = 0
            for (const obj of this.state.delegates.results) {
                rows.push({
                    id: index++,
                    cells:[
                        {id: "delegate", content: <Text size="xl">{obj.delegate}</Text>},
                        {id: "delegator", content: <Text size="xl">{obj.delegator}</Text>},
                        {id: "label", content: <Text size="xl">{obj.label}</Text>}
                    ]
                })
            }
        }
        return (
            <Card className="card">
                <Dot color="rinkeby">
                    <Text size="xl" color="white">
                        4
                    </Text>
                </Dot>
                <Title size="xs">Your delegates</Title>
                <Button style={{marginBottom: "20px"}} onClick={this.fetchDelegates} size="md" iconType="received" color="secondary" variant="bordered" iconSize="sm">
                    <Text size="xl" color="secondary">
                        Fetch Delegates
                    </Text>
                </Button>
                <Table headers={headerCells} rows={rows} />
            </Card>
        );
    }

    getAddDelegatesView() {
        return (
            <Card className="card">
                <Dot color="rinkeby">
                    <Text size="xl" color="white">
                        5
                    </Text>
                </Dot>
                <Title size="xs">Add / Edit delegates</Title>
                <Text size="xl" style={{marginBottom: "20px"}}>A new delegate address input will create new delegate for your safe, a new label the existed delegate address will override the previous label.</Text>
                <TextField
                    id="add-delegate-delegate"
                    label="Delegate"
                    value={this.state.add_delegate}
                    onChange={(e) => this.setState({add_delegate: e.target.value})}
                />
                <br/>
                <TextField
                    style={{marginTop: "20px"}}
                    id="add-delegate-label"
                    label="Label"
                    value={this.state.add_label}
                    onChange={(e) => this.setState({add_label: e.target.value})}
                />
                <br/>
                <Button onClick={this.addDelegate} style={{marginTop: "20px"}} size="md" iconType="sendAgain" color="secondary" variant="bordered" iconSize="sm">
                    <Text size="xl" color="secondary">
                        Add / Edit Delegate
                    </Text>
                </Button>
            </Card>
        )
    }

    getRemoveDelegatesView() {
        return (
            <Card className="card">
                <Dot color="rinkeby">
                    <Text size="xl" color="white">
                        6
                    </Text>
                </Dot>
                <Title size="xs">Remove delegates</Title>
                <TextField
                    id="add-delegate-delegate"
                    label="Delegate"
                    value={this.state.remove_delegate}
                    onChange={(e) => this.setState({remove_delegate: e.target.value})}
                />
                <br/>
                <Button onClick={this.removeDelegate} style={{marginTop: "20px"}} size="md" iconType="delete" color="secondary" variant="bordered" iconSize="sm">
                    <Text size="xl" color="secondary">
                        Remove Delegate
                    </Text>
                </Button>
            </Card>
        )
    }

    render() {
        let connectView, configureSafeAddressView, delegatesView, addDelegatesView, removeDelegatesView;

        connectView = this.getConnectView();
        configureSafeAddressView = this.getConfigureSafeAddressView();

        if (this.state.connected && this.state.safe_account.length > 0) {
            delegatesView = this.getDelegatesView();
            addDelegatesView = this.getAddDelegatesView();
            removeDelegatesView = this.getRemoveDelegatesView();
        }

        return (
            <div className="App">
                <Title size="md">Gnosis-Safe Delegation DAPP</Title>
                <Card className="card">
                    <Dot color="primary">
                        <Text size="xl" color="white">
                            1
                        </Text>
                    </Dot>
                    <Title size="xs">Introduction</Title>
                    <Text size="xl">This DAPP demonstrates how to allow Gnosis-Safe delegation via Metamask or Ledger, without revealing the private key of users. Note that in this Demo, we only show you delegation with Metamask. However, it is very easy to add even more wallet connector (e.g. trezor, etc.) simply by switching the wallet connector for Web3React.</Text>
                    <Text size="xl" color="error">Make sure all addresses you inputted in this webpage are checksum-ed!</Text>
                </Card>
                <Card className="card">
                    <Dot color="primary">
                        <Text size="xl" color="white">
                            2
                        </Text>
                    </Dot>
                    <Title size="xs">Connect to your wallet</Title>
                    {connectView}
                </Card>
                {configureSafeAddressView}
                {delegatesView}
                {addDelegatesView}
                {removeDelegatesView}
            </div>
        );
    }
}

export default withUseWeb3React(App);

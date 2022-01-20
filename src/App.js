import React, {Component} from "react";
import {Button, Card, Divider, Dot, EthHashInfo, Table, Text, TextField, Title} from "@gnosis.pm/safe-react-components";
import {InjectedConnector} from "@web3-react/injected-connector";
import {useWeb3React} from '@web3-react/core';
import badgerLOGO from './imgs/badger.png'
import utils from "./utils"
import "./App.css"

const [supportedChainID, chainId2Entry] = utils.getSupportedChainID();

const injectedConnector = new InjectedConnector({ supportedChainIds: supportedChainID });

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
            connected: false,
            safeAccount: "",
            safeAccounts: [],
            delegates: null,
            addDelegate: "",
            addLabel: "",
            removeDelegate: "",
            txBaseUrl: "",
        };

        this.connectWalletMetamask = this.connectWalletMetamask.bind(this);
        this.disconnectWalletMetamask = this.disconnectWalletMetamask.bind(this);
        this.getSafeAddress = this.getSafeAddress.bind(this);
        this.getConnectView = this.getConnectView.bind(this);
        this.getSignature = this.getSignature.bind(this);
        this.fetchDelegates = this.fetchDelegates.bind(this);
        this.addDelegate = this.addDelegate.bind(this);
        this.removeDelegate = this.removeDelegate.bind(this);
        this.getDelegatesView = this.getDelegatesView.bind(this);
    }


    async connectWalletMetamask() {
        this.props.web3ReactHookValue.activate(injectedConnector, undefined, true)
            .then(r => {
                injectedConnector.getAccount().then((account) => {
                    this.setState({connected: true,
                        txBaseUrl: utils.getTxServiceBaseURL(chainId2Entry[this.props.web3ReactHookValue.chainId])});
                    window.ethereum.on('chainChanged', utils.reloadPage);
                }).catch((e) => {alert(e); console.error(e)});
            }).catch((e) => {alert(e); console.error(e)});
    }

    disconnectWalletMetamask() {
        this.props.web3ReactHookValue.deactivate()
        injectedConnector.deactivate();
        this.setState({
            connected: false,
            safeAccount: "",
            safeAccounts: [],
            delegates: null,
            addDelegate: "",
            addLabel: "",
            removeDelegate: "",
            txBaseUrl: "",
        });
        window.ethereum.removeListener('chainChanged', utils.reloadPage);
    }

    async getSignature(delegate) {
        const totp = Math.floor(Date.now() / 1000 / 3600);
        const msg = delegate + totp;
        let sig = await this.props.web3ReactHookValue.library.getSigner(this.props.web3ReactHookValue.account).signMessage(msg)
        return utils.adjustV(sig);
    }

    async fetchDelegates() {
        const account = this.state.safeAccount;
        fetch(`${this.state.txBaseUrl}/api/v1/safes/${account}/delegates/`)
            .then((response) => response.json())
            .then(data => {
                this.setState({delegates: data.results});
            })
    }

    async addDelegate() {
        const account = this.state.safeAccount;
        const delegate = utils.getChecksumAddress(this.state.addDelegate);
        const label = this.state.addLabel;

        const signature = await this.getSignature(delegate);
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
        fetch(`${this.state.txBaseUrl}/api/v1/safes/${account}/delegates/`, requestOptions)
            .then(response => response.json())
            .then(data => {
                this.setState({"addDelegate": "", "addLabel": ""})
                this.fetchDelegates();
            });
    }

    async removeDelegate() {
        const account = this.state.safeAccount;
        const delegate = utils.getChecksumAddress(this.state.removeDelegate);

        const signature = await this.getSignature(delegate);
        const requestOptions = {
            method: 'DELETE',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({
                "signature": signature
            })
        };
        fetch(`${this.state.txBaseUrl}/api/v1/safes/${account}/delegates/${delegate}/`, requestOptions)
            .then(response => {
                this.setState({"removeDelegate": ""})
                this.fetchDelegates();
            })
    }

    async getSafeAddress() {
        if (!this.state.connected) {
            alert("You need to firstly connect to your wallet.");
            return
        }
        fetch(`${this.state.txBaseUrl}/api/v1/owners/${this.props.web3ReactHookValue.account}/safes/`)
            .then(response => response.json())
            .then(data => {
                let checksumData = []
                for (const safeAddr of data.safes) {
                    checksumData.push(utils.getChecksumAddress(safeAddr))
                }
                this.setState({"safeAccounts": checksumData});
            })
    }

    getConnectView() {
        let connectAction;
        if (this.state.connected) {
            connectAction = (
                <>
                    <Button className="network-icon" size="md" color="secondary" disabled>
                        {utils.capitalizeFirstLetter(chainId2Entry[this.props.web3ReactHookValue.chainId])}
                    </Button>
                    <EthHashInfo hash={utils.getChecksumAddress(this.props.web3ReactHookValue.account)} showIdenticon showCopyBtn name="Your Wallet Address"/>
                    <Divider/>
                    <Button onClick={this.disconnectWalletMetamask} size="md" iconType="unlocked" color="secondary" variant="bordered" iconSize="sm">
                        <Text size="xl" color="secondary">
                            Disconnect Wallet
                        </Text>
                    </Button>
                </>
            )
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
        return (
            <Card className="card">
                <Dot color="primary">
                    <Text size="xl" color="white">
                        2
                    </Text>
                </Dot>
                <Title size="xs">Connect to your wallet</Title>
                {connectAction}
            </Card>
        )
    }

    getConfigureSafeAddressView() {
        const headerCells = [
            {id: "address", label: "Safe Address"},
            {id: "action", label: "Action"},
        ]
        const rows = [];
        let index = 0
        for (const obj of this.state.safeAccounts) {
            rows.push({
                id: index++,
                cells:[
                    {id: "address", content: <Text size="xl">{obj}</Text>},
                    {id: "action", content: (
                            <Button onClick={(e) => {this.setState({safeAccount: `${obj}`});}} size="md" iconType="received" color="secondary" variant="bordered" iconSize="sm">
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
                <EthHashInfo hash={this.state.safeAccount} showIdenticon showCopyBtn name="Your Safe Address"/>
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
            for (const obj of this.state.delegates) {
                rows.push({
                    id: index++,
                    cells:[
                        {id: "delegate", content: <Text size="xl">{utils.getChecksumAddress(obj.delegate)}</Text>},
                        {id: "delegator", content: <Text size="xl">{utils.getChecksumAddress(obj.delegator)}</Text>},
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
                    value={this.state.addDelegate}
                    onChange={(e) => this.setState({addDelegate: e.target.value})}
                />
                <br/>
                <TextField
                    style={{marginTop: "20px"}}
                    id="add-delegate-label"
                    label="Label"
                    value={this.state.addLabel}
                    onChange={(e) => this.setState({addLabel: e.target.value})}
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
                    value={this.state.removeDelegate}
                    onChange={(e) => this.setState({removeDelegate: e.target.value})}
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

        if (this.state.connected && this.state.safeAccount.length > 0) {
            delegatesView = this.getDelegatesView();
            addDelegatesView = this.getAddDelegatesView();
            removeDelegatesView = this.getRemoveDelegatesView();
        }

        return (
            <div className="App">
                <Title size="md">Gnosis-Safe Delegation DAPP</Title>
                <div className="credit">
                    <span>Made by <a href="https://github.com/Soptq">Soptq</a> for</span>
                    <a href="https://badger.finance"><img style={{height: "30px", display: "inline-block", verticalAlign: "middle", paddingBottom: "5px"}} src={badgerLOGO} alt="Badger Logo"/></a>
                </div>
                <Card className="card">
                    <Dot color="primary">
                        <Text size="xl" color="white">
                            1
                        </Text>
                    </Dot>
                    <Title size="xs">Introduction</Title>
                    <Text size="xl">This DAPP demonstrates how to allow Gnosis-Safe delegation via Metamask or Ledger, without revealing the private key of users. Note that in this tool, we only show you delegation with Metamask. However, it is very easy to add even more wallet connector (e.g. walletconnect, trezor, etc.) simply by switching the wallet connector for <a href="https://github.com/NoahZinsmeister/web3-react">Web3React</a>.</Text>
                    <Divider/>
                    <Text size="xl" style={{display: "flex", "gap": "4px"}}>Currently supports: {
                        supportedChainID.map((chainId) =>
                            (<span key={chainId} className="emphasize">{utils.capitalizeFirstLetter(chainId2Entry[chainId])}</span>))
                    }
                    </Text>
                    <Text size="xl">Feel free to review and deploy your own service at <a href="https://github.com/Soptq/gnosis-safe-delegate-dapp">https://github.com/Soptq/gnosis-safe-delegate-dapp</a>.</Text>
                </Card>
                {connectView}
                {configureSafeAddressView}
                {delegatesView}
                {addDelegatesView}
                {removeDelegatesView}
            </div>
        );
    }
}

export default withUseWeb3React(App);

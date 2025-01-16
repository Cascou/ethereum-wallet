import React, { useEffect, useState } from "react";
import {
    Divider,
    Tooltip,
    List,
    Avatar,
    Spin,
    Tabs,
    Input,
    Button,
    message,
    Select,
    Dropdown,
    Menu
} from 'antd';
import { LogoutOutlined, InfoCircleOutlined, DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { CHAINS_CONFIG } from '../chains';
import { ethers } from 'ethers';
import bvaLogo from '../assets/bvaLogo.svg';
import { SendTransaction, GenerateAddress } from '../utils/WalletUtils';

function WalletView({
    wallet,
    setWallet,
    seedPhrase,
    setSeedPhrase,
    selectedChain,
    setLoggedIn,
    privateKey,
    setPrivateKey, 
    password,
    setLastUsedIndex,
    lastUsedIndex
}) {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [balance, setBalance] = useState(0);
    const [fetching, setFetching] = useState(true);
    const [amountToSend, setAmountToSend] = useState(null);
    const [sendToAddress, setSendToAddress] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [hash, setHash] = useState(null);
    const [nonValid, setNonValid] = useState(false);
    const [pk, setPK] = useState(null);
    const [walletOptions, setWalletOptions] = useState([{ address: wallet, privateKey: privateKey}]);
    const [selectedWallet, setSelectedWallet] = useState('');

    const amountChange = (e) => {
        setNonValid(false);
        setAmountToSend(e.target.value);
    };
 
    const items = [
        {
            key: "2",
            label: `Tokens`,
            children: tokens ? (
                <></>
            ) : (
                <>
                    <span> You seem to not have any tokens yet</span>
                    <p className="frontPageBottom">
                        Need Help? Contact
                        <a href="https://www.bitcoinvendingafrica.com" target="_blank" rel="noreferrer">
                            BVA support
                        </a>
                    </p>
                </>
            ),
        },
        {
            key: "1",
            label: `Transfer`,
            children: (
                <>
                    <h3>Native Balance</h3>
                    <h1 style={{ fontSize: '18px' }}>
                        {balance} {CHAINS_CONFIG[selectedChain].ticker}
                    </h1>
                    <div className="sendRow">
                        <p style={{ width: '90px', textAlign: 'left' }}>To: </p>
                        <Input
                            value={sendToAddress}
                            onChange={(e) => setSendToAddress(e.target.value)}
                            placeholder="0x.."
                        />
                    </div>
                    <div className="sendRow">
                        <p style={{ width: '90px', textAlign: 'left' }}>Amount: </p>
                        <Input
                            value={amountToSend}
                            onChange={amountChange}
                            placeholder="Amount of Native Token you wish to send..."
                        />
                    </div>
                    <Button
                        style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}
                        type="primary"
                        onClick={() => sendTransaction(sendToAddress, amountToSend, wallet, privateKey)}
                    >
                        Send Tokens
                    </Button>
                    {processing && (
                        <>
                            <Spin />
                            {hash && (
                                <Tooltip title={hash}>
                                    <p>Transaction Hash</p>
                                </Tooltip>
                            )}
                        </>
                    )}
                </>
            ),
        },
    ];

    async function sendTransaction(destination, amount, from, privatekey) {
        if (!destination || !amount) {
            message.error("Fill in missing fields");
            return;
        }
        if (balance < amount) {
            message.error("Insufficient Balance");
            return;
        } else {
            setProcessing(true);

            const rawTransaction = await SendTransaction(destination, amount, from, privateKey);

            const url = `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API}`;

            const response = await axios.post(url, {
                id: 1,
                jsonrpc: '2.0',
                params: [rawTransaction],
                method: 'eth_sendRawTransaction'
            }, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.result) {
                setHash(response.data.result);
                setAmountToSend(null);
                setSendToAddress(null);

                setTimeout(() => {
                    getAccountTokens();
                }, 3000);
                setTimeout(() => {
                    setProcessing(null);
                }, 5000);
            }
        }
    }
    function getPrivateKeyHex(input){
        const pks = input;
        const pkBytes = pks.split(',').map(Number);
        const pkBuffer = Buffer.from(pkBytes);
        const pkHex = pkBuffer.toString('hex');
        setPK(pkHex);
    }

    async function getAccountTokens(input) {
        setFetching(true);
        const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API}`);
        const balanceWei = await provider.getBalance(input);
        const balance = ethers.formatEther(balanceWei);
        setBalance(balance);
        setFetching(false);
    }

    function logout() {
        message.info('Logged Out.');
        setSeedPhrase(null);
        setTokens(null);
        setBalance(null);
        setLoggedIn(null);
        navigate('/');
    }

    async function AddAccount() {
        const { address, privateKey: secret } = await GenerateAddress(seedPhrase, password, lastUsedIndex);
        
        // Update the walletOptions state
        const newWalletOption = { address, privateKey: secret };
        setWalletOptions((prevOptions) => [...prevOptions, newWalletOption]);
        setLastUsedIndex(lastUsedIndex + 1);
        setSelectedWallet(address);
        setWallet(address);
        setPrivateKey(secret);
        getPrivateKeyHex(secret);
        message.success("Wallet created successfully.");
    }

    const handleSelectChange = async (event) => {
        setSelectedWallet(event);
        const myWallet = walletOptions.find((walletObj)=> walletObj.address === event)
        
        if(myWallet){
            console.log(myWallet);
            setWallet(myWallet.address);
            setPrivateKey(myWallet.privateKey);
            getPrivateKeyHex(myWallet.privateKey);
            setBalance(0);
            setTokens(null);
            await getAccountTokens(event);
        }
    };

    useEffect(() => {
        if (!wallet || !selectedChain) return;
        setTokens(null);
        setBalance(0);
        getAccountTokens();
    }, [wallet, selectedChain]);

    const menu = (
        <Menu>
            <Menu.Item key="1">
                <Tooltip title={pk} >
                  <InfoCircleOutlined style={{marginRight: '16px'}} />private key
                </Tooltip>
            </Menu.Item>
            <Menu.Item key="2" onClick={logout}>
                <LogoutOutlined style={{marginRight: '16px'}}/>   logout
            </Menu.Item>
        </Menu>
    );

    return (
        <>
           <header>
        <img src={bvaLogo} className='headerLogo' alt='logo'/>
        <Select
          onChange={(val)=>setSelectedChain(val)}
          value={selectedChain}
          options={[
            {
              label: "sepolia",
              value: "0xaa36a7"
            }
          ]}
          className='dropdown'
        ></Select>
      </header>
        <div className="content">
            <div className="logoutButton">
                <Dropdown overlay={menu} trigger={['click']}>
                    <div className="dropdownButton">
                        <DownOutlined style={{"marginLeft": '15px'}}/>
                    </div>
                </Dropdown>
            </div>
        <div className="walletName">Wallet</div>
        <Tooltip title={selectedWallet}>
                    <Select
                        style={{ fontSize: '14px', width: '100%' }}
                        placeholder={`${wallet.slice(0, 4)}...${wallet.slice(-4)}`}
                        value={selectedWallet} 
                        onChange={handleSelectChange}
                    >   
                         {walletOptions.map((option, index) => (
                            <Select.Option key={index} value={option.address}>
                                {option.address}
                            </Select.Option>
                        ))}
                    </Select>
                </Tooltip>
        <Button
        type="primary"
        style={{ marginTop: '10px', width: '100%' }}
        onClick={AddAccount}
        >
            Add Account
        </Button>
        <Divider />
        <Tabs defaultActiveKey="1" items={items} className="walletView" />
        </div>
        </>
    );
}

export default WalletView;

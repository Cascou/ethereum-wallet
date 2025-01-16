import React, { useEffect, useState } from "react";
import {
    Divider,
    Tooltip,
    Spin,
    Tabs,
    Input,
    Button,
    message,
    Select,
    Dropdown,
    Menu,
} from 'antd';
import {
    Box,
    Dialog,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    TextField,
    Button as ButtonA
  } from "@mui/material";
  import CryptoJS from 'crypto-js';
  import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import Snackbar from '@mui/material/Snackbar';
import { LogoutOutlined, InfoCircleOutlined, DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { CHAINS_CONFIG } from '../chains';
import { ethers } from 'ethers';
import bvaLogo from '../assets/bvaLogo.svg';
import { SendTransaction, GenerateAddress } from '../utils/WalletUtils';


function WalletView2({
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
    const [walletOptions, setWalletOptions] = useState([{ address: "wallet", privateKey: privateKey}]);
    const [selectedWallet, setSelectedWallet] = useState('');
    const [wallet, setWallet] = useState('');
    const [walletArray, setWalletArray] = useState([]);
    const [walletName, setWalletName] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [walletPK, setWalletPK] = useState('');
    const [open, setOpen] = useState(false);
    const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
    const [mainSeed, setMainSeed] = useState();
    const [walletIndex, setWalletIndex] = useState();
    const [tokenArray, setTokenArray] = useState([]);
    const [openToken, setOpenToken] = useState(false);
    const [tokenName, setTokenName] = useState("");
    const [tokenSymbol, setTokenSymbol] = useState("");
    const [tokenContract, setTokenContract] = useState("");

    const tokenAbi = [
        "function balanceOf(address owner) view returns (uint256)"
    ];

    const amountChange = (e) => {
        setNonValid(false);
        setAmountToSend(e.target.value);
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleOpenToken = () => setOpenToken(true);
    const handleCloseToken = () => setOpenToken(false);

    const handleAddToken = () => {
        if (!tokenName || !tokenSymbol || !tokenContract) {
            alert("Please fill all fields!");
            return;
        }
    
        const newToken = {
            tokenId: Date.now().toString(),
            name: tokenName,
            symbol: tokenSymbol,
            address: tokenContract,
        };
    
        const request = indexedDB.open("myWallet", 1);
        
        request.onsuccess = function (event) {
            const db = event.target.result;
    
            // Begin a transaction and access the Tokens object store
            const transaction = db.transaction(["Tokens"], "readwrite");
            const tokenStore = transaction.objectStore("Tokens");
    
            const addRequest = tokenStore.add(newToken);
    
            addRequest.onsuccess = function () {
                message.success("Token added successfully!");
                setTokenName("");
                setTokenSymbol("");
                setTokenContract("");
                getAccountTokens();
                handleClose();
            };
    
            addRequest.onerror = function () {
                alert("Failed to add token. It may already exist.");
            };
        };
    
        request.onerror = function () {
            alert("Failed to open database.");
        };
    };
    
    
        
    const handleSelect = (wallet) => {
        setWalletName(`Account ${wallet.index}`);
        setWalletAddress(wallet.address);
        setWalletPK(wallet.pk);
        getAccountTokens();
        handleClose();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress);
            setCopySnackbarOpen(true);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleSnackbarClose = () => {
        setCopySnackbarOpen(false);
    };
 
    const items = [
        {
            key: "2",
            label: `Tokens`,
            children: tokenArray && tokenArray.length > 0 ? (
                <List
                    sx={{
                        padding: 0,
                        backgroundColor: "#f49120",
                        borderRadius: "8px",
                    }}
                >
                    {tokenArray.map((token, index) => (
                        <ListItem
                            key={index}
                            disablePadding
                            sx={{
                                '&:hover': { backgroundColor: "#db8119" },
                            }}
                        >
                            <ListItemButton>
                                <ListItemText
                                    primary={token.name}
                                    secondary={
                                        <>
                                            <span><strong>Symbol:</strong> {token.symbol}</span><br />
                                            <span><strong>Balance:</strong> {token.balance}</span>
                                        </>
                                    }
                                    primaryTypographyProps={{
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        color: "#333",
                                    }}
                                    secondaryTypographyProps={{
                                        fontSize: "12px",
                                        color: "#666",
                                        wordBreak: "break-all", // Ensure long addresses wrap properly
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    <Button
                    type="primary"
                    style={{ marginTop: '10px', width: '100%' }}
                    onClick={handleOpenToken}
                    >
                        Add Token
                    </Button>
                </List>
            ) : (
                <>
                    <span>You seem to not have any tokens yet</span>
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
                        onClick={() => sendTransaction(sendToAddress, amountToSend, walletAddress, privateKey)}
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

    async function sendTransaction(destination, amount, from) {
        if (!destination || !amount) {
            message.error("Fill in missing fields");
            return;
        }
        if (balance < amount) {
            message.error("Insufficient Balance");
            return;
        } else {
            setProcessing(true);
            getPrivateKeyHex(walletPK)
            console.log(pk);
            const rawTransaction = await SendTransaction(destination, amount, from, walletPK);
            console.log(rawTransaction);
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
            console.log(response);
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
        console.log(pkHex);
    }

    async function getAccountTokens() {
        try {
            const provider = new ethers.JsonRpcProvider(
                `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API}`
            );
            const request = indexedDB.open("myWallet", 1);
    
            request.onsuccess = async (event) => {
                const db = event.target.result;
                const transaction = db.transaction(["Tokens"], "readonly");
                const objectStore = transaction.objectStore("Tokens");
    
                // Fetch all tokens from IndexedDB
                const getAllRequest = objectStore.getAll();
                getAllRequest.onsuccess = async (event) => {
                    const results = event.target.result;
                    if (results && results.length > 0) {
                        // Prepare tokens array with initial data
                        const fetchedTokens = results.map((result) => ({
                            name: result.name,
                            symbol: result.symbol,
                            address: result.address,
                            balance: "Fetching...", // Placeholder for balances
                        }));
    
                        // Update state with the tokens
                        setTokenArray(fetchedTokens);
    
                        // Fetch balances concurrently
                        const updatedTokens = await Promise.all(
                            fetchedTokens.map(async (token) => {
                              try {
                                if (token.name === "Ethereum") {
                                  // Fetch Ethereum balance
                                  const balanceWei = await provider.getBalance(walletAddress);
                                  const balance = ethers.formatEther(balanceWei);
                                  return { ...token, balance };
                                } else {
                                  // Fetch ERC-20 token balance
                                  if (!ethers.isAddress(token.address)) {
                                    throw new Error(`Invalid address for ${token.name}`);
                                  }
                                  
                                  console.log(`Fetching balance for token ${token.name} at address ${token.address}`);
                                  
                                  const erc20 = new ethers.Contract(token.address, tokenAbi, provider);
                                  const balanceWei = await erc20.balanceOf(walletAddress.toString()); // Ensure walletAddress is a string
                                  const balance = ethers.formatEther(balanceWei);
                                  return { ...token, balance };
                                }
                              } catch (error) {
                                console.error(`Failed to fetch balance for ${token.name}:`, error);
                                return { ...token, balance: "Error fetching balance" }; // Return error message for failed fetch
                              }
                            })
                          );
                          
                          // Update the tokens with fetched balances
                          setTokenArray(updatedTokens);
                          
                    } else {
                        message.error("No token data found.");
                    }
                };
    
                getAllRequest.onerror = () => {
                    message.error("Error fetching token data. Please try again.");
                };
            };
    
            // Fetch native balance
            setFetching(true);
            try {
                console.log(walletAddress);
                const balanceWei = await provider.getBalance(walletAddress);
                const balance = ethers.formatEther(balanceWei);
                setBalance(balance);
            } catch (error) {
                console.error("Failed to fetch native balances", error);
                message.error("Error fetching native balances.");
            } finally {
                setFetching(false);
            }
        } catch (error) {
            console.error("Error in getAccountTokens:", error);
            message.error("An unexpected error occurred. Please try again.");
        }
    }
    
    async function getAccountDetails(){
        const request = indexedDB.open("myWallet", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["WalletDetails"], "readonly");
            const objectStore = transaction.objectStore("WalletDetails");
      
            // Fetch all records from the object store
            const getAllRequest = objectStore.getAll();
      
            getAllRequest.onsuccess = (event) => {
              const results = event.target.result;
              if (results) {
                  const newWalletArray = results.map((result, index) => ({
                      index,
                      address: result.address,
                      pk: result.privateKey,
                      value: result.value
                  }));
                  setWalletArray(newWalletArray);
                  const defaultWallet = newWalletArray[0];
                  const decryptedSeed = CryptoJS.AES.decrypt(defaultWallet.value, password);
                  const originalSeed = decryptedSeed.toString(CryptoJS.enc.Utf8);
                  setMainSeed(originalSeed);
                  setWalletName(`Account ${defaultWallet.index}`);
                  setWalletAddress(defaultWallet.address);
                  setWalletPK(defaultWallet.pk);
                  setWalletIndex(walletArray.length);
                  
              } else {
                  message.error("No wallet data found.");
              }
            };
      
            getAllRequest.onerror = () => {
                message.error("Error fetching wallet data. Please try again.");
            };
        };
    }

    function logout() {
        message.info('Logged Out.');
        setTokens(null);
        setBalance(null);
        setLoggedIn(null);
        navigate('/');
    }

    async function AddAccount() {
        const updatedIndex = walletArray.length; // Use the length of walletArray for the new index
    
        // Generate the new wallet's address and private key
        const { address, privateKey: secret } = await GenerateAddress(mainSeed, password, updatedIndex);
    
        // Open the IndexedDB database
        const request = indexedDB.open("myWallet", 1);
    
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            // Start a transaction for adding a new wallet
            const transaction = db.transaction(["WalletDetails"], "readwrite");
            const objectStore = transaction.objectStore("WalletDetails");
    
            // Create an object representing the new wallet
            const newWallet = {
                id: "User" + updatedIndex, // Use updatedIndex to generate a unique ID
                index: updatedIndex,
                address: address,
                privateKey: secret,
            };
    
            // Add the new wallet to the object store
            const addRequest = objectStore.add(newWallet);
    
            addRequest.onsuccess = () => {
                message.success("Wallet created successfully");
    
                // After adding the wallet, update the walletArray state to trigger re-render
                const newWalletArray = [...walletArray, newWallet];
                setWalletArray(newWalletArray); // Update the walletArray with the new wallet
            };
    
            addRequest.onerror = () => {
                message.error("Error adding wallet to the database.");
            };
        };
    
        request.onerror = () => {
            message.error("Error opening IndexedDB. Please try again.");
        };
    }

    useEffect(() => {
        if (!selectedChain) return;
        setTokens(null);
        setBalance(0);
        getAccountDetails();
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
        <ButtonA
        variant="text"
        sx={{
            color: "white",
            fontSize: "12px"
        }}
        onClick={handleOpen}
        >
            {walletName}
        </ButtonA>

        <Typography
        sx={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center" }}
        onClick={handleCopy}
        >
            <FileCopyIcon sx={{ width: "11px", height: "11px", marginRight: "4px" }} />
            {walletAddress.slice(0,5)}...{walletAddress.slice(-5)}
        </Typography>
          
        <Button
        type="primary"
        style={{ marginTop: '10px', width: '100%' }}
        onClick={AddAccount}
        >
            Add Accounts
        </Button>

        <Dialog
        open={open}
        onClose={handleClose}
        sx={{
            '& .MuiPaper-root': { // Style the dialog container
                backgroundColor: "#f49120",
                padding: '16px',
            },
        }}
        >
            <DialogTitle
            sx={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
                marginBottom: "8px",
            }}
            >
                Select an Account
            </DialogTitle>
            
            <List
            sx={{
                padding: 0,
                backgroundColor: "#fff",
                borderRadius: "8px",
            }}
            >
                {walletArray.map((wallet) => (
                    <ListItem
                    key={wallet.index}
                    disablePadding
                    sx={{
                        '&:hover': { backgroundColor: "#f9f9f9" },
                    }}
                    >
                        <ListItemButton onClick={() => handleSelect(wallet)}>
                            <ListItemText
                            primary={`Account ${wallet.index}`}
                            secondary={wallet.address}
                            primaryTypographyProps={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#333",
                            }}
                            secondaryTypographyProps={{
                                fontSize: "12px",
                                color: "#666",// Ensure long addresses wrap properly
                            }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Dialog>

      <Dialog
        open={openToken}
        onClose={handleCloseToken}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "#f49120",
            padding: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Add Token
        </DialogTitle>
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <TextField
            label="Token Name"
            variant="outlined"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
          />
          <TextField
            label="Symbol"
            variant="outlined"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
          />
          <TextField
            label="Token Contract"
            variant="outlined"
            value={tokenContract}
            onChange={(e) => setTokenContract(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddToken}
          >
            Add Token
          </Button>
        </Box>
      </Dialog>
        <Divider />
        <Tabs defaultActiveKey="1" items={items} className="walletView" />
        <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message="Address copied!"
        action={
            <FileCopyIcon size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
                ✖
            </FileCopyIcon>
        }
        />
        </div>
        </>
    );
}

export default WalletView2;

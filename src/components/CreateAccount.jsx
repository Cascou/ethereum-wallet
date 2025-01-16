import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Button, Card, Input, message } from 'antd';
import Alert from '@mui/material/Alert';
import bvaLogo from '../assets/bvaLogo.svg';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useNavigate } from 'react-router-dom';
import { GenerateMnemonic, GenerateAddress } from '../utils/WalletUtils';

function CreateAccount({ setSeedPhrase, setWallet, setLoggedIn, setPrivateKey, setPassword, setLastUsedIndex, lastUsedIndex}) {
    const [pw, setPw] = useState('');
    const [newSeedPhrase, setNewSeedPhrase] = useState(null);
    const [index, setIndex] = useState(null);


    const navigate = useNavigate();

    const handleChange = (e) => setPw(e.target.value);

    const generateWallet = async () => {
        try {
            const mnemonic = await GenerateMnemonic();
            setNewSeedPhrase(mnemonic);
        } catch (error) {
            message.error("Failed to generate seed phrase. Please try again.");
        }
    };

    const setWalletAndMnemonic = async (seed, input) => {
        const request = indexedDB.open("myWallet", 1);

        request.onsuccess = function (event) {
            const db = event.target.result;

            const transaction = db.transaction(["UserIndex"], "readonly");
            const objectStore = transaction.objectStore("UserIndex");
            const getRequest = objectStore.get("User");

            getRequest.onsuccess = function (event) {
                const result = event.target.result;
                if (result) {
                    setLastUsedIndex(result.value);
                } else {
                    message.error("User index not found.");
                    return;
                }

                try {
                    const { address, privateKey} = GenerateAddress(seed, input, lastUsedIndex);
                    setLastUsedIndex(lastUsedIndex + 1);
                    const transaction2 = db.transaction(["WalletDetails"], "readwrite");
                    const walletStore = transaction2.objectStore("WalletDetails");

                    const hash = CryptoJS.AES.encrypt(seed, input).toString();
                    const walletData = { id: 'User', value: hash, address };

                    const addRequest = walletStore.add(walletData);

                    addRequest.onsuccess = function () {
                        setSeedPhrase(seed);
                        setWallet(address);
                        setPrivateKey(privateKey);
                        setPassword(input);
                        setLoggedIn(true);
                        message.success("Wallet created successfully.");
                    };

                    addRequest.onerror = function () {
                        message.error("Error storing wallet data. Try again.");
                    };
                } catch (error) {
                    message.error("Failed to generate wallet. Please try again.");
                }
            };

            getRequest.onerror = function () {
                message.error("Error accessing user index. Try again.");
            };
        };

        request.onerror = function () {
            message.error("Failed to open IndexedDB.");
        };
    };

    return (
        <>
         <header>
                <img src={bvaLogo} className="headerLogo" alt="logo" />
              
            </header>
            <div className="content">
                <Box sx={{ width: '100%' }}>
                    <Stepper sx={{fontSize: '8px'}} activeStep={1} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
                <Button
                    className='frontPageButton'
                    type="primary"
                    onClick={generateWallet}
                >
                    Generate Seed Phrase
                </Button>
                <Card className='seedPhraseContainer'>
                    {newSeedPhrase && <pre style={{ whiteSpace: 'pre-wrap' }}>{newSeedPhrase}</pre>}
                </Card>
                <Input
                    type='password'
                    className='frontPageInput'
                    value={pw}
                    onChange={handleChange}
                    placeholder="Enter your password"
                />
                <Button
                    className='frontPageButton'
                    type='default'
                    onClick={() => setWalletAndMnemonic(newSeedPhrase, pw)}
                    disabled={!pw || !newSeedPhrase}
                >
                    Create Wallet
                </Button>
                <p className='frontPageBottom'>
                    <Button
                        className='frontPageButton'
                        type='default'
                        onClick={() => navigate('/')}
                    >
                        Back
                    </Button>
                </p>
            </div>
        </>
    );
}

export default CreateAccount;

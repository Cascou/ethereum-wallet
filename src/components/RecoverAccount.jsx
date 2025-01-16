import React from 'react';
import CryptoJS from 'crypto-js';
import { BulbOutlined } from '@ant-design/icons';
import {Button, Input, message} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {CheckMnemonic, GenerateAddress} from '../utils/WalletUtils';

const {TextArea} = Input;

function RecoverAccount({setSeedPhrase, setWallet, setLoggedIn, setPrivateKey, setPassword, setLastUsedIndex, lastUsedIndex}){
    const [pw, setPw] = useState('');
    const [typedSeed, setTypedSeed] = useState('');
    const [nonValid, setNonValid] = useState(false);
    const [index, setIndex] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setNonValid(false);
        setPw(e.target.value);
    };

    function seedAdjust(e){
        setTypedSeed(e.target.value);
    }

    async function recoverWallet(seed, input){
        if(seed == null || input == null){
            message.error('Fill in missing fields');
        }else{
            const result = await CheckMnemonic(seed);

            if(!result){
                message.error('Incorrect Mnemonic');
            }else{
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
                                navigate('/wallet');
                                setLoggedIn(true);
                                message.success("Wallet imported Successfully");
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
            }
        }
    }

    return(
        <>
            <div className='content'>
                <div className='mnemonic'>
                    <BulbOutlined style={{fontSize: '20px'}}/>
                    <div style={{ fontSize: '12px' }}>
                        Type your seed phrase and password to recover your account
                    </div>
                </div>
                <TextArea
                value={typedSeed}
                onChange={seedAdjust}
                rows={8}
                className='seedPhraseContainer'
                placeholder='Type your seed phrase here...'
                >

                </TextArea>
                <Input
                    type='password'
                    className='frontPageInput'
                    value={pw}
                    onChange={handleChange}
                    placeholder="Enter your password"
                />
                <Button
                    disabled={
                        typedSeed.split(" ").length!==24 || typedSeed.slice(-1) === " " || !pw
                    }
                    className='frontPageButton'
                    type='primary'
                    onClick={()=>recoverWallet(typedSeed, pw)}
                >
                    Recover Wallet
                </Button>
                <p className='frontPageBottom'>
                <Button
                    className='frontPageButton'
                    type='default'
                    onClick={()=> navigate('/')}
                >
                    Back
                </Button>
                </p>
            </div>
        
        </>
    )
}

export default RecoverAccount;
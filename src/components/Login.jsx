import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Button, Input, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

function Login({ setLoggedIn, setSeedPhrase, setWallet, setPassword}) {
    const [pw, setPw] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setPw(e.target.value);
    };

    const SignIn = (pw) => {
        setLoading(true);
        const request = indexedDB.open("myWallet", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["WalletDetails"], "readonly");
            const objectStore = transaction.objectStore("WalletDetails");

            const getRequest = objectStore.get("User");

            getRequest.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    try {
                        // Decrypt the stored seed phrase
                        const decryptedSeed = CryptoJS.AES.decrypt(result.value, pw);
                        const originalSeed = decryptedSeed.toString(CryptoJS.enc.Utf8);
                        
                        if (originalSeed) {
                            setSeedPhrase(originalSeed);
                            setWallet(result.address);
                            setPassword(pw);
                            setLoggedIn(true);
                            message.success("Login Successful.");
                            navigate('/wallet');
                        } else {
                            message.error('Invalid password.');
                        }
                    } catch (err) {
                        message.error('Invalid password.');
                    } finally {
                        setLoading(false);
                    }
                } else {
                    message.error('Error finding user.');
                    setLoading(false);
                }
            };

            getRequest.onerror = (event) => {
                console.error("Error fetching data:", event.target.error);
                message.error("Error fetching wallet data. Please try again.");
                setLoading(false);
            };
        };

        request.onerror = () => {
            console.error("Failed to open IndexedDB.");
            message.error("Failed to connect to wallet database.");
            setLoading(false);
        };
    };

    return (
        <div className='content'>
            <h2>Welcome</h2>
            <h4>Enter your password to log in.</h4>
            <Input
                type='password'
                className='frontPageInput'
                value={pw}
                onChange={handleChange}
                placeholder="Enter your password"
            />
            <Button
                disabled={!pw}
                className='frontPageButton'
                type='primary'
                onClick={() => SignIn(pw)}
                loading={loading}
            >
                {loading ? <Spin /> : 'Sign In'}
            </Button>
            <p className='frontPageBottom'>
                Need Help? Contact{' '}
                <a href="https://www.bitcoinvendingafrica.com" target="_blank" rel="noreferrer">
                    BVA support
                </a>
            </p>
        </div>
    );
}

export default Login;

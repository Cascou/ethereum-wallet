import React, { useState, useEffect } from 'react';
import bvaLogo from '../assets/bvaLogo.svg';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import {message} from 'antd';
import { Button as ButtonA } from 'antd';
import { Select } from 'antd';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { GenerateMnemonic, GenerateAddress } from '../utils/WalletUtils';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import Snackbar from '@mui/material/Snackbar';
import { styled } from '@mui/material/styles';
import CryptoJS from 'crypto-js';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import wordList from "../utils/wordlist/en.json";

function CreateAccount2({setLoggedIn}) {
    const [showPassword, setShowPassword] = React.useState(false);
    const [checked, setChecked] = useState(false); // State to manage checkbox
    const [selectLanguage, setSelectedLanguage] = useState('EN');
    const [activeStep, setActiveStep] = useState(0); // Current step
    const [password, setPasswordState] = useState(''); // Password state
    const [confirmPassword, setConfirmPasswordState] = useState(''); // Confirm password state
    const [passwordsMatch, setPasswordsMatch] = useState(true); // State to track if passwords match
    const steps = ['Create password', 'Secure Wallet', 'Confirm phrase'];
    const [strength, setStrength] = useState('');
    const [newSeedPhrase, setNewSeedPhrase] = useState(null);
    const [lastUsedIndex, setLastUsedIndex] = useState(0);
    const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
    const [wordListState, setWordListState] = useState([]);
    const [inputValues, setInputValues] = useState(["", "", "", ""]); // Track values for each input field
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

   
    const Demo = styled('div')(({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(2),
    }));

    useEffect(() => {
        // Simulate fetching data if needed
        setWordListState(wordList);
      }, []);

      useEffect(() => {
        const allFieldsValid = inputValues.every((value) =>
          wordListState.includes(value)
        );
        setIsButtonDisabled(!allFieldsValid);
      }, [inputValues, wordListState]);

      const handleInputChange = (index, value) => {
        setInputValues((prev) => {
          const newValues = [...prev];
          newValues[index] = value;
          return newValues;
        });
      };

    const handleTerms = (event) => {
        setChecked(event.target.checked); // Update state when checkbox is toggled
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    const handlePasswordChange = (e) => {
        const { value } = e.target;
        setPasswordState(value);
        checkPasswordStrength(value);
    };

    const handleConfirmPasswordChange = (e) => {
        const { value } = e.target;
        setConfirmPasswordState(value);
        setPasswordsMatch(password === value); // Check if passwords match
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(newSeedPhrase);
            setCopySnackbarOpen(true);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleSnackbarClose = () => {
        setCopySnackbarOpen(false);
    };

    const checkPasswordStrength = (password) => {
        let strength = '';
        const lengthRegEx = /.{8,}/;//min length: 8
        const numberRegEx = /[0-9]/;
        const lowercaseRegEx = /[a-z]/;
        const uppercaseRegEx = /[A-Z]/;
        const specialCharRegEx = /[!@#$%^&*(),.?":{}|<>]/;

        if (lengthRegEx.test(password) && numberRegEx.test(password) && lowercaseRegEx.test(password) && uppercaseRegEx.test(password) && specialCharRegEx.test(password)) {
            strength = 'Strong';
        } else if (lengthRegEx.test(password) && (numberRegEx.test(password) || specialCharRegEx.test(password))) {
            strength = 'Medium';
        } else if (lengthRegEx.test(password)) {
            strength = 'Weak';
        } else {
            strength = 'Very Weak';
        }
        
        setStrength(strength);
    };

    const Step2Continue = async() =>{
        setActiveStep(2);
    }

    const Step3Continue = async() =>{
        const mnemonicWordsArray = newSeedPhrase.split(" ");
        if(
            inputValues[0] === mnemonicWordsArray[3] && 
            inputValues[1] == mnemonicWordsArray[7] &&
            inputValues[2] == mnemonicWordsArray[11] &&
            inputValues[3] == mnemonicWordsArray[15])
        {
            message.success("Sucess! Seed phrase confirmed.")
            setLoggedIn(true);
        }else{
            message.error("Failed, does not match seed.")
        }
    }

    const setWalletAndMnemonic = async () => {
        try {
            // Step 1: Generate mnemonic and set state
            const mnemonic = await GenerateMnemonic();
            setNewSeedPhrase(mnemonic); // Update state asynchronously
            console.log("Generated mnemonic:", mnemonic); // Use the directly generated value
            
            // Step 2: Open IndexedDB
            const request = indexedDB.open("myWallet", 1);
    
            request.onsuccess = function (event) {
                const db = event.target.result;
    
                // Step 3: Retrieve user index
                const transaction = db.transaction(["UserIndex"], "readonly");
                const objectStore = transaction.objectStore("UserIndex");
                const getRequest = objectStore.get("User");
    
                getRequest.onsuccess = function (event) {
                    const result = event.target.result;
                    if (result) {
                        setLastUsedIndex(result.value);
                        console.log("Last used index:", result.value);
                    } else {
                        message.error("User index not found.");
                        return;
                    }
    
                    try {
                        // Use the `mnemonic` directly instead of `newSeedPhrase`
                        const { address, privateKey } = GenerateAddress(mnemonic, password, result.value);
                        setLastUsedIndex(result.value + 1);
    
                        // Step 4: Store wallet details
                        const transaction2 = db.transaction(["WalletDetails"], "readwrite");
                        const walletStore = transaction2.objectStore("WalletDetails");
    
                        const hash = CryptoJS.AES.encrypt(mnemonic, password).toString();
                        const walletData = { id: "User", value: hash, address, privateKey };
    
                        const addRequest = walletStore.add(walletData);
    
                        addRequest.onsuccess = function () {
                            message.success("Wallet created successfully.");
                            setActiveStep(1);
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
        } catch (error) {
            message.error("Failed to generate seed phrase. Please try again.");
        }
    };
    
    // Render content for each step
    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <h2 style={{fontSize: '23px'}}>Create a Password</h2>
                        <p>Enter a strong password and remember it.</p>

                        <FormControl
                            sx={{
                                width: "90%",
                                marginTop: "20px",
                                color: "#28282a"
                            }}
                            variant="standard">
                            <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
                            <Input
                                sx={{
                                    width: "90%",
                                    marginTop: "20px",
                                    color: "#28282a",
                                }}
                                id="standard-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={handlePasswordChange} // Update password state
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? 'hide the password' : 'display the password'}
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>

                        {/* Display a message for password strength */}
                        <div style={{ display: 'flex', marginLeft: '16px', textAlign: 'left', fontSize: '14px', alignItems: 'center' }}>
                            {strength === 'Very Weak' && <p>Password strength: <span style={{ color: 'red' }}>very weak</span></p>}
                            {strength === 'Weak' && <p>Password strength: <span style={{ color: 'orange' }}>weak</span></p>}
                            {strength === 'Medium' && <p>Password strength: <span style={{ color: 'yellow' }}>good</span></p>}
                            {strength === 'Strong' && <p>Password strength: <span style={{ color: 'green' }}>strong</span></p>}
                        </div>


                        <FormControl
                            sx={{
                                width: "90%",
                                marginTop: "20px",
                                color: "#28282a",
                            }}
                            variant="standard">
                            <InputLabel htmlFor="standard-adornment-password">Confirm Password</InputLabel>
                            <Input
                                sx={{
                                    width: "90%",
                                    marginTop: "20px",
                                    color: "#28282a",
                                }}
                                id="standard-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange} // Update confirm password state
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={showPassword ? 'hide the password' : 'display the password'}
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        {/* Display a message if passwords don't match */}
                        {!passwordsMatch && (
                            <p style={{ color: 'red', fontSize: "14px", marginLeft: '16px', textAlign: 'left' }}>Passwords do not match</p>
                        )}
                        <FormGroup
                            sx={{
                                marginTop: '10px',
                                marginLeft: '12px'
                            }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={checked}
                                        onChange={handleTerms} // Update checkbox state
                                    />
                                }
                                label="BVA can't recover this password"
                            />
                        </FormGroup>

                        <ButtonA
                            className='frontPageButton'
                            type='primary'
                            onClick={() => setWalletAndMnemonic()}
                            disabled={!checked || !passwordsMatch || !password} // Disable if terms aren't checked or passwords don't match
                        >
                            Create Wallet
                        </ButtonA>
                    </div>
                );
            case 1:
                const mnemonicWordsArray = newSeedPhrase.split(" ");
                return (
                    <div>
                        <h2 style={{fontSize: '23px'}}>Secure Your Wallet</h2>
                        <p>Backup your wallet's recovery seed phrase.</p>
                        <ButtonGroup color='tetiary' sx={{marginTop: "8px"}}  variant="contained" aria-label="Basic button group">
                            <Button sx={{fontSize: "8px"}}>1. {mnemonicWordsArray[0]}</Button>
                            <Button sx={{fontSize: "8px"}}>2. {mnemonicWordsArray[1]}</Button>
                            <Button sx={{fontSize: "8px"}}>3. {mnemonicWordsArray[2]}</Button>
                            <Button sx={{fontSize: "8px"}}>4. {mnemonicWordsArray[3]}</Button>
                        </ButtonGroup>
                        <ButtonGroup color='tetiary' sx={{marginTop: "8px"}}  variant="contained" aria-label="Basic button group">
                            <Button sx={{fontSize: "8px"}}>5. {mnemonicWordsArray[4]}</Button>
                            <Button sx={{fontSize: "8px"}}>6. {mnemonicWordsArray[5]}</Button>
                            <Button sx={{fontSize: "8px"}}>7. {mnemonicWordsArray[6]}</Button>
                            <Button sx={{fontSize: "8px"}}>8. {mnemonicWordsArray[7]}</Button>
                        </ButtonGroup>
                        <ButtonGroup color='tetiary' sx={{marginTop: "8px"}}  variant="contained" aria-label="Basic button group">
                            <Button sx={{fontSize: "8px"}}>9. {mnemonicWordsArray[8]}</Button>
                            <Button sx={{fontSize: "8px"}}>10. {mnemonicWordsArray[9]}</Button>
                            <Button sx={{fontSize: "8px"}}>11. {mnemonicWordsArray[10]}</Button>
                            <Button sx={{fontSize: "8px"}}>12. {mnemonicWordsArray[11]}</Button>
                        </ButtonGroup>
                        <ButtonGroup color='tetiary' sx={{marginTop: "8px"}}  variant="contained" aria-label="Basic button group">
                            <Button sx={{fontSize: "8px"}}>13. {mnemonicWordsArray[12]}</Button>
                            <Button sx={{fontSize: "8px"}}>14. {mnemonicWordsArray[13]}</Button>
                            <Button sx={{fontSize: "8px"}}>15. {mnemonicWordsArray[14]}</Button>
                            <Button sx={{fontSize: "8px"}}>16. {mnemonicWordsArray[15]}</Button>
                        </ButtonGroup>
                        <ButtonGroup color='tetiary' sx={{marginTop: "8px"}}  variant="contained" aria-label="Basic button group">
                            <Button sx={{fontSize: "8px"}}>17. {mnemonicWordsArray[16]}</Button>
                            <Button sx={{fontSize: "8px"}}>18. {mnemonicWordsArray[17]}</Button>
                            <Button sx={{fontSize: "8px"}}>19. {mnemonicWordsArray[18]}</Button>
                            <Button sx={{fontSize: "8px"}}>20. {mnemonicWordsArray[19]}</Button>
                        </ButtonGroup>
                        <ButtonGroup color='tetiary' sx={{marginTop: "8px"}}  variant="contained" aria-label="Basic button group">
                            <Button sx={{fontSize: "8px"}}>21. {mnemonicWordsArray[20]}</Button>
                            <Button sx={{fontSize: "8px", color: "white", opacity: "100%"}}>22. {mnemonicWordsArray[21]}</Button>
                            <Button sx={{fontSize: "8px"}}>23. {mnemonicWordsArray[22]}</Button>
                            <Button sx={{fontSize: "8px"}}>24. {mnemonicWordsArray[23]}</Button>
                        </ButtonGroup>
                        <FormGroup
                            sx={{
                                marginTop: '10px',
                                marginLeft: '12px'
                            }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={checked}
                                        onChange={handleTerms} // Update checkbox state
                                    />
                                }
                                label="BVA can't recover your seed phrase."
                            />
                        </FormGroup>
                        <Typography
                        sx={{ marginLeft: "15px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        onClick={handleCopy}
                        >
                            <FileCopyIcon sx={{ width: "11px", height: "11px", marginRight: "4px" }} />
                            Copy Seed Phrase
                        </Typography>
                        <ButtonA
                            className='frontPageButton'
                            type='primary'
                            onClick={() => Step2Continue()}
                             
                            disabled={!checked || !passwordsMatch || !password} // Disable if terms aren't checked or passwords don't match
                        >
                            Continue
                        </ButtonA>

                        <Snackbar
                        open={copySnackbarOpen}
                        autoHideDuration={3000}
                        onClose={handleSnackbarClose}
                        message="Seed phrase copied to clipboard!"
                        action={
                            <FileCopyIcon size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
                                ✖
                            </FileCopyIcon>
                        }
                        />
                      
                    </div>
                        
                );
            case 2:
                return (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                    <h2 style={{ fontSize: "24px", color: "#28282a" }}>Confirm Your Seed Phrase</h2>
                    <p style={{ fontSize: "16px", color: "#595959" }}>Re-enter your seed phrase to confirm.</p>
                    {[1, 2, 3, 4].map((_, index) => (
                        <Autocomplete
                        key={index}
                        disablePortal
                        options={wordListState}
                        onChange={(event, value) => handleInputChange(index, value || "")}
                        sx={{
                            backgroundColor: "transparent",
                            color: "#fff",
                            borderRadius: "5px",
                            marginTop: "10px",
                            "& .MuiOutlinedInput-root": {
                            height: "40px",
                            width: "300px",
                            alignItems: "center"
                            },
                        }}
                        renderInput={(params) => (
                            <TextField
                            {...params}
                            label={`${(index + 1) * 4}th Word`}
                            sx={{ fontSize: "6px", backgroundColor: "transparent" }}
                            />
                        )}
                        />
                    ))}
                   <ButtonA
                   className="frontPageButton"
                   type='primary'
                   onClick={() => Step3Continue()}
                   disabled={isButtonDisabled} // Disable if all fields aren't valid
                   >
                    Verify
                   </ButtonA>
                  </div>
                );
            default:
                return <p>Unknown step</p>;
        }
    };

    return (
        <>
            <header>
                <img src={bvaLogo} className="headerLogo" alt="logo" />
                <Select
                    onChange={(val) => setSelectedLanguage(val)}
                    value={selectLanguage}
                    options={[{ label: 'English', value: 'EN' }]}
                    className="dropdown"
                />
            </header>
            <div className="content">
                <Box sx={{ width: '100%' }}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Step-specific content */}
                    <div className="stepContent">
                        {renderStepContent(activeStep)}
                    </div>
                </Box>
            </div>
        </>
    );
}

export default CreateAccount2;

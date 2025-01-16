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
import {message} from 'antd';
import { Button as ButtonA } from 'antd';
import { Select } from 'antd';
import CryptoJS from 'crypto-js';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import wordList from "../utils/wordlist/en.json";
import {CheckMnemonic, GenerateAddress} from '../utils/WalletUtils';
import { useNavigate } from 'react-router-dom';

function RecoverAccount2({setLoggedIn}) {
    const [showPassword, setShowPassword] = React.useState(false);
    const [checked, setChecked] = useState(false); // State to manage checkbox
    const [selectLanguage, setSelectedLanguage] = useState('EN');
    const [activeStep, setActiveStep] = useState(0); // Current step
    const [password, setPasswordState] = useState(''); // Password state
    const [confirmPassword, setConfirmPasswordState] = useState(''); // Confirm password state
    const [passwordsMatch, setPasswordsMatch] = useState(true); // State to track if passwords match
    const steps = ['confirm password', 'confirm seed phrase'];
    const [strength, setStrength] = useState('');
    const [newSeedPhrase, setNewSeedPhrase] = useState(null);
    const [lastUsedIndex, setLastUsedIndex] = useState(0);
    const [wordListState, setWordListState] = useState([]);
    const [inputValues, setInputValues] = useState(["", "", "", "","", "", "", "","", "", "", "","", "", "", "","", "", "", "","", "", "", "",]); // Track values for each input field
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const navigate = useNavigate();


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

    const Step1Continue = async() =>{
        setActiveStep(1);
    }

    const recoverWallet = async() =>{
        const seed = inputValues.join(" ").trim();
        const result = await CheckMnemonic(seed);

        console.log(seed +'i');
        console.log(password);

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
                            const { address, privateKey} = GenerateAddress(seed, password, lastUsedIndex);
                            const transaction2 = db.transaction(["WalletDetails"], "readwrite");
                            const walletStore = transaction2.objectStore("WalletDetails");
        
                            const hash = CryptoJS.AES.encrypt(seed, password).toString();
                            const walletData = { id: 'User', value: hash, address, privateKey };
        
                            const addRequest = walletStore.add(walletData);
        
                            addRequest.onsuccess = function () {
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
        
    // Render content for each step
    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <h2 style={{fontSize: '23px'}}>Enter your accounts password</h2>
                        <p>Enter your account password.</p>

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
                            onClick={() => Step1Continue()}
                            disabled={!checked || !passwordsMatch || !password} // Disable if terms aren't checked or passwords don't match
                        >
                            Continue
                        </ButtonA>
                    </div>
                );
            case 1:
                return (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <h2 style={{fontSize: '23px'}}>Access Your Wallet</h2>
                        <p>Enter your 24 word seed phrase</p>
                        
                        <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 2fr)", // Four inputs per row
                            gap: "10px", // Spacing between inputs
                        }}
                        >
                            
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((_, index) => (
                            <Autocomplete
                            key={index}
                            disablePortal
                            options={wordListState}
                            onChange={(event, value) => handleInputChange(index, value || "")}
                            sx={{
                                backgroundColor: "transparent",
                                color: "#fff",
                                borderRadius: "5px",
                                "& .MuiOutlinedInput-root": {
                                height: "30px", // Adjust height for smaller size
                                width: "90%", // Ensure it fits within the grid cell
                                alignItems: "top",
                                fontSize: "9px"
                                },
                                "& .MuiInputLabel-root": {
                                    fontSize: "8px", // Adjust font size for label
                                },
                            }}
                            renderInput={(params) => (
                                <TextField
                                {...params}
                                label={`Word ${index + 1}`}
                                sx={{ fontSize: "5px" }}
                                />
                            )}
                            />
                        ))}
                        </div>
                        
                        <ButtonA
                        className="frontPageButton"
                        type='primary'
                        onClick={() => recoverWallet()}
                        disabled={isButtonDisabled} // Disable if all fields aren't valid
                        >
                            Confirm Seed Phrase
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

export default RecoverAccount2;

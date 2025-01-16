import React, { useState } from 'react';
import { Button } from 'antd';
import bvaLogo from '../assets/bvaLogo.svg';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Favorite from '@mui/icons-material/Favorite';
import { Select } from 'antd';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [selectLanguage, setSelectedLanguage] = useState('EN');
    const [checked, setChecked] = useState(false); // State to manage checkbox
    const navigate = useNavigate();

    const handleTerms = (event) => {
        setChecked(event.target.checked); // Update state when checkbox is toggled
    };

    return (
        <>
            <header>
                <img src={bvaLogo} className="headerLogo" alt="logo" />
                <Select
                    onChange={(val) => setSelectedLanguage(val)}
                    value={selectLanguage}
                    options={[
                        {
                            label: 'English',
                            value: 'EN',
                        },
                    ]}
                    className="dropdown"
                />
            </header>
            <div className="content">
                <h2>Welcome</h2>
                <h4>To Africa's first self-custody wallet 🚀 </h4>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={checked}
                                onChange={handleTerms} // Update checkbox state
                            />
                        }
                        label="I Agree to BVA's Terms of Use"
                    />
                </FormGroup>

                {/* Buttons are disabled when `checked` is false */}
                <Button
                    onClick={() => navigate('/wallet')}
                    className="frontPageButton"
                    type="primary"
                    disabled={!checked} // Disable when checkbox is unchecked
                >
                    Create Wallet
                </Button>

                <Button
                    onClick={() => navigate('/recover')}
                    className="frontPageButton"
                    type="default"
                    disabled={!checked} // Disable when checkbox is unchecked
                >
                    Sign in With Seed Phrase
                </Button>

                <p className="frontPageBottom">
                    Need Help? Contact{' '}
                    <a
                        href="https://www.bitcoinvendingafrica.com"
                        target="_blank"
                        rel="noreferrer"
                    >
                        BVA support
                    </a>
                </p>
            </div>
        </>
    );
}

export default Home;

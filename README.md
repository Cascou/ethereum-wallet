# Basic Crypto Wallet (Work in Progress)

## Wallet Overview
This basic ethereum-based self custody wallet, allows users to send native currency(ETH) by signing raw transactions and transmitting the hash through RPC providers. The aim of this project, is to create a basic self custody wallet without relying on external Web3 libraries
---------------------------------------------------------------------
## Core Features

## Wallet
- Create a wallet using 24 word seed phrase + password.
- Import Wallet using 24 word seed phrase + password.
- Indexed wallet creation for multiple account on the same seed phrase.

## Transaction
- Sending raw ethereum transactions through RPC provider.

## Tokens
- Users can import various tokens that exist on the sepolia network.
----------------------------------------------------------------------
#### Improvements 
- Adding more networks, only Sepolia at the moment.
- Interacting with smart contracts to allow sending of ERC20 tokens.
- Improve various UI components to be more mordernized & simple.
- Refactoring, Restructuring of code.
- Swap feature between ERC20 tokens.
- Display NFT holdings.
  
#### Bugs
- There are some rendering bugs in the frontend to fix.
----------------------------------------------------------------------
## Usage
    # Installing Packages
    npm install

    # Running Project
    npm run dev

import { createHash, randomBytes, pbkdf2Sync } from 'crypto';
import { keccak256 } from 'ethereumjs-util';
import  {BIP32Factory} from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as  secp256 from 'secp256k1';
import {ethers} from 'ethers';
import * as RLP from 'rlp';
import { secp256k1 } from '@noble/curves/secp256k1';
import {bytesToHex, hexToBytes} from '@ethereumjs/util'
const bip32 =  BIP32Factory(ecc);

export async function GenerateMnemonic() {
    // Step 1: Load English Wordlist
    const wordlist = (await import('../utils/wordlist/en.json')).default;
  
    // Step 2: Create Binary Entropy (256 bits)
    const entropyBytes = randomBytes(32); // 32 bytes = 256 bits
  
    // Step 3: Create Checksum (SHA256 hash of entropy)
    const checksumLength = (entropyBytes.length * 8) / 32; // Checksum length in bits
    const sha256Hash = createHash('sha256').update(entropyBytes).digest();
    const checksum = Array.from(sha256Hash)
      .map(byte => byte.toString(2).padStart(8, '0'))
      .join('')
      .slice(0, checksumLength); // Get the first 'checksumLength' bits
  
    // Step 4: Combine entropy and checksum
    const entropy = Array.from(entropyBytes)
      .map(byte => byte.toString(2).padStart(8, '0'))
      .join('');
    const full = entropy + checksum;
  
    // Step 5: Split combined string into 11-bit groups
    const pieces = full.match(/.{1,11}/g) || [];
  
    // Step 6: Convert 11-bit groups into words using wordlist
    const sentence = pieces.map(piece => {
      const index = parseInt(piece, 2);
      return wordlist[index].trim();
    });
  
    // Step 7: Join the words into a mnemonic sentence
    const mnemonic = sentence.join(' ');
  
    return mnemonic;
}

export function GenerateAddress(seed, input, index){
    //Step 8: Create the seed from mnemonic and password
    const passphrase = input;

    const password = seed;
    const salt = `mnemonic${passphrase}`;
    const iterations = 2048;
    const keyLength = 64;
    const digest = 'sha512';

    //Step 9: use pbkdf2 to derive seed
    const seedBuffer = pbkdf2Sync(password, salt, iterations, keyLength, digest);

    // Step 10: Create BIP32 root from seed
    const root = bip32.fromSeed(seedBuffer);

    let newIndex = index++;
    // Step 11: Derive the private key from the path
    const hdPath = `m/44'/60'/0'/0/${newIndex}`;
    
    const childNode = root.derivePath(hdPath);

    // Step 12: Extract Private Key
    const privateKey = childNode.privateKey.toString('hex');

    // Step 13: Generate Public Key from Private Key
    const publicKey = secp256.publicKeyCreate(childNode.privateKey, false).slice(1);  // Remove the leading byte

    // Step 14: Convert the public key to a Buffer
    const publicKeyBuffer = Buffer(publicKey);

    // Step 15: Hash the Public Key using Keccak-256
    const publicKeyHash = keccak256(publicKeyBuffer);

    // Step 16: Extract last 20 bytes for Ethereum address
    const address = "0x" + publicKeyHash.slice(-20).toString('hex');

    return {address, privateKey, newIndex};
}

export async function CheckMnemonic(seed) {

  // Step 1: Load English Wordlist
  const wordlist = (await import('../utils/wordlist/en.json')).default;


  // Step 2: Split the seed phrase into individual words
  const seedWords = seed.split(' ');

  // Step 3: Validate each word against the word list
  const isValidMnemonic = seedWords.every(word => wordlist.includes(word));
  
  let result;

  if (!isValidMnemonic) {
    result = false;  
  }else{
    result = true;
  }

  return result;
}

export async function SendTransaction (destination, amount, from, privatekey){ 

  const privateKeyBytes = privatekey.split(',').map(Number);
  const privateKeyBuffer = Buffer.from(privateKeyBytes);

  const provider = new ethers.InfuraProvider('sepolia', import.meta.env.VITE_INFURA_API);

  //Getting Fees
  const gasResponse = await provider.getFeeData();

  // Step 0: Getting fields for Transaction
  const chainId = 11155111;  // Sepolia Testnet chain ID
  const nonce = await provider.getTransactionCount(from);
  const gasPrice = gasResponse.gasPrice;
  const gasLimit = 21000;
  const to = destination;
  const value = ethers.parseEther(amount);
  const data = '0x';

  // Prepare transaction parameters
  const txParams = [
    `0x${nonce.toString(16)}`, // nonce
    `0x${gasPrice.toString(16)}`, // gasPrice
    `0x${gasLimit.toString(16)}`, // gasLimit
    to, // to
    `0x${value.toString(16)}`, // value
    data // data
  ];

  // Convert parameters to bytes and RLP encode
  const encodedTx = RLP.encode([...txParams.map((param) => hexToBytes(param)), hexToBytes('0x' + chainId.toString(16)),"",""]);
  // Hash the RLP-encoded transaction
  const msgHash = ethers.keccak256(encodedTx);
  // Sign the hash using the private key
  const signature = secp256k1.sign(cleanHex(msgHash), privateKeyBuffer);
  const { r, s, recovery } = signature;

  // Adjust for v based on `eip-155`
  const v = recovery + 2 * chainId + 35;

  // Construct the signed transaction for sending
  const signedTxParams = [
    txParams[0], // nonce
    txParams[1], // gasPrice
    txParams[2], // gasLimit
    txParams[3], // to
    txParams[4], // value
    txParams[5], // data
    `0x${v.toString(16)}`, // v
    `0x${r.toString(16)}`, // r
    `0x${s.toString(16)}`, // s
  ];
  
  // RLP encode the signed transaction
  const rawTx = bytesToHex(RLP.encode(signedTxParams.map((param) => hexToBytes(param))));
  
  return rawTx;
}

function cleanHex(hex) {
  if (hex.startsWith('0x')) {
      return hex.slice(2);
  }
  return hex;
}
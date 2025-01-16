import './App.css';
import {useState} from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './components/Home';
import RecoverAccount2 from './components/RecoverAccount2';
import CreateAccount2 from './components/CreateAccount2';
import WalletView2 from './components/WalletView2';
import Login from './components/Login';


function App() {
  const [selectedChain, setSelectedChain] = useState('0xaa36a7');
  const [wallet, setWallet] = useState(null);
  const [seedPhrase, setSeedPhrase] = useState(null);
  const [loggedIn, setLoggedIn] = useState(null);
  const [password, setPassword] = useState('');
  const [activeAccount, setActiveAccount] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const request = indexedDB.open("myWallet", 1);
  const [lastUsedIndex, setLastUsedIndex] = useState(0);

  request.onupgradeneeded = function (event) {
    const db = event.target.result;

    // Create an object store named "UserIndex" with keyPath set to "id"
    if (!db.objectStoreNames.contains("UserIndex")) {
        const userIndexStore = db.createObjectStore("UserIndex", { keyPath: "id" });
        const initialData = { id: "User", value: 0 };
        userIndexStore.add(initialData);
        setLastUsedIndex(0);
    }

    // Create an object store named "WalletDetails" with keyPath set to "id"
    if (!db.objectStoreNames.contains("WalletDetails")) {
        db.createObjectStore("WalletDetails", { keyPath: "id" });
    }

    // Create an object store named "Tokens" with keyPath set to "tokenId"
    if (!db.objectStoreNames.contains("Tokens")) {
        const tokenStore = db.createObjectStore("Tokens", { keyPath: "tokenId" });

        // Add indexes for name and symbol
        tokenStore.createIndex("name", "name", { unique: false });
        tokenStore.createIndex("symbol", "symbol", { unique: false });

        // Add initial token data
        tokenStore.transaction.oncomplete = function () {
            const tokenTransaction = db.transaction("Tokens", "readwrite");
            const tokenObjectStore = tokenTransaction.objectStore("Tokens");

            const initialTokens = [
                { tokenId: "1", name: "Ethereum", symbol: "ETH", address: "0x0000000000000000000000000000000000000000" },
                { tokenId: "2", name: "Chainlink", symbol: "LINK", address: "0x779877A7B0D9E8603169DdbD7836e478b4624789" },
            ];

            initialTokens.forEach((token) => {
                tokenObjectStore.add(token);
            });
        };
    }
};

request.onsuccess = function (event) {
    const db = event.target.result;

    // Check if the object store "WalletDetails" exists
    if (db.objectStoreNames.contains("WalletDetails")) {
        let transaction = db.transaction(["WalletDetails"], "readonly");
        let objectStore = transaction.objectStore("WalletDetails");

        let getRequest = objectStore.get("User");

        getRequest.onsuccess = function (event) {
            let result = event.target.result;
            if (result) {
                setActiveAccount(true);
                setWallet(result.address);
            }
        };
    }
};

  return (
    <div className="App">
      <BrowserRouter>

      {loggedIn && wallet? (
        <Routes>
          <Route
            path="/wallet"
            element={
              <WalletView2
                setLoggedIn={setLoggedIn}
                password={password}
                selectedChain={selectedChain}
              />
            }
          />
        </Routes>
      ) : wallet ? (
        <Routes>
          <Route
            path="/*"
            element={
              <Login
                setLoggedIn={setLoggedIn}
                setSeedPhrase={setSeedPhrase}
                setWallet={setWallet}
                setPassword={setPassword}
              />
            }
          />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
            <Route 
              path="/recover" 
              element={
                <RecoverAccount2
                setLoggedIn={setLoggedIn}
                />
              } 
            />
          <Route
            path="/wallet"
            element={
              <CreateAccount2
              setLoggedIn={setLoggedIn}
              />
            }
          />
        </Routes>
      )}
    </BrowserRouter>
    </div>
  );
}

export default App;

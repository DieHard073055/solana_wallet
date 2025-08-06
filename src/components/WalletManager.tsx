import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { shortenAddress } from '../utils/validation';

const WalletManager: React.FC = () => {
  const { wallet, generateWallet, importWalletFromString, disconnectWallet, exportPrivateKey } = useWallet();
  const [importKey, setImportKey] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState('');

  const handleImport = () => {
    if (!importKey.trim()) {
      setError('Please enter a private key');
      return;
    }

    const success = importWalletFromString(importKey);
    if (success) {
      setImportKey('');
      setShowImport(false);
      setError('');
    } else {
      setError('Invalid private key format');
    }
  };

  const handleExport = () => {
    const privateKey = exportPrivateKey();
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      alert('Private key copied to clipboard!');
    }
  };

  if (!wallet.isConnected) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
        <h3>Wallet Setup</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={generateWallet}
            style={{ 
              padding: '10px 20px', 
              marginRight: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Generate New Wallet
          </button>
          
          <button 
            onClick={() => setShowImport(!showImport)}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Import Wallet
          </button>
        </div>

        {showImport && (
          <div style={{ marginTop: '20px' }}>
            <h4>Import Wallet</h4>
            <textarea
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              placeholder="Enter private key as JSON array (e.g., [123, 45, 67, ...])"
              style={{ 
                width: '100%', 
                height: '100px', 
                marginBottom: '10px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <div>
              <button 
                onClick={handleImport}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Import
              </button>
              <button 
                onClick={() => {
                  setShowImport(false);
                  setImportKey('');
                  setError('');
                }}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <h3>Wallet Connected</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Address:</strong> {wallet.publicKey}</p>
        <p><strong>Short Address:</strong> {wallet.publicKey ? shortenAddress(wallet.publicKey) : ''}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowExport(!showExport)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {showExport ? 'Hide' : 'Export'} Private Key
        </button>
        
        <button 
          onClick={disconnectWallet}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Disconnect Wallet
        </button>
      </div>

      {showExport && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#3a3a3a', 
          border: '1px solid #555', 
          borderRadius: '4px',
          marginTop: '10px',
          color: '#fff'
        }}>
          <p><strong>⚠️ Warning:</strong> Never share your private key with anyone!</p>
          <button 
            onClick={handleExport}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy Private Key to Clipboard
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
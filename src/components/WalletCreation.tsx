import React, { useState } from 'react';

interface WalletCreationProps {
  onCreateWallet: () => Promise<boolean>;
  onImportWallet: (privateKey: string) => Promise<boolean>;
  onBack: () => void;
  mode: 'create' | 'import';
  isLoading?: boolean;
  error?: string;
}

const WalletCreation: React.FC<WalletCreationProps> = ({
  onCreateWallet,
  onImportWallet,
  onBack,
  mode,
  isLoading = false,
  error
}) => {
  const [privateKey, setPrivateKey] = useState('');

  const handleSubmit = async () => {
    if (mode === 'create') {
      await onCreateWallet();
    } else {
      if (!privateKey.trim()) return;
      await onImportWallet(privateKey);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#242424',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ marginBottom: '30px', color: '#007bff' }}>
          {mode === 'create' ? 'Create New Wallet' : 'Import Wallet'}
        </h2>

        {mode === 'create' && (
          <div style={{ marginBottom: '30px' }}>
            <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>
              A new wallet will be generated and encrypted with your PIN.
            </p>
            <div style={{
              backgroundColor: '#3a3a3a',
              border: '1px solid #555',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <p style={{ color: '#b0b0b0', fontSize: '14px', margin: 0 }}>
                ⚠️ <strong>Important:</strong> Make sure to export and backup your private key after creation!
              </p>
            </div>
          </div>
        )}

        {mode === 'import' && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#b0b0b0', marginBottom: '15px' }}>
              Private Key (JSON Array)
            </h4>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter your private key as JSON array: [123, 45, 67, ...]"
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#3a3a3a',
                border: '1px solid #555',
                borderRadius: '8px',
                color: '#fff',
                padding: '15px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'monospace'
              }}
            />
            <p style={{ color: '#b0b0b0', fontSize: '12px', marginTop: '10px' }}>
              Paste your private key as a JSON array. It will be encrypted with your PIN.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={
              isLoading || 
              (mode === 'import' && !privateKey.trim())
            }
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading ? '#6c757d' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: (mode === 'import' && !privateKey.trim()) ? 0.5 : 1
            }}
          >
            {isLoading ? 'Processing...' : (mode === 'create' ? 'Create Wallet' : 'Import Wallet')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletCreation;
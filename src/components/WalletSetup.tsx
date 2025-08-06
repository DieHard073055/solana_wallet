import React, { useState } from 'react';

interface WalletSetupProps {
  onCreateWallet: (pin: string) => Promise<boolean>;
  onImportWallet: (privateKey: string, pin: string) => Promise<boolean>;
  onBack: () => void;
  mode: 'create' | 'import';
  isLoading?: boolean;
  error?: string;
}

const WalletSetup: React.FC<WalletSetupProps> = ({
  onCreateWallet,
  onImportWallet,
  onBack,
  mode,
  isLoading = false,
  error
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const handleDigitClick = (digit: string, target: 'pin' | 'confirm') => {
    if (target === 'pin' && pin.length < 4) {
      setPin(pin + digit);
    } else if (target === 'confirm' && confirmPin.length < 4) {
      setConfirmPin(confirmPin + digit);
    }
  };

  const handleBackspace = (target: 'pin' | 'confirm') => {
    if (target === 'pin') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleClear = (target: 'pin' | 'confirm') => {
    if (target === 'pin') {
      setPin('');
    } else {
      setConfirmPin('');
    }
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      return;
    }

    if (mode === 'create') {
      if (confirmPin.length !== 4) {
        return;
      }
      if (pin !== confirmPin) {
        return;
      }
      await onCreateWallet(pin);
    } else {
      if (!privateKey.trim()) {
        return;
      }
      await onImportWallet(privateKey, pin);
    }
  };

  const renderPinInput = (value: string, target: 'pin' | 'confirm', label: string) => (
    <div style={{ marginBottom: '30px' }}>
      <h4 style={{ color: '#b0b0b0', marginBottom: '15px', textAlign: 'center' }}>
        {label}
      </h4>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: index < value.length ? '#007bff' : '#3a3a3a',
              border: '2px solid #555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#fff'
            }}
          >
            {index < value.length ? '●' : ''}
          </div>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '15px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigitClick(digit.toString(), target)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#3a3a3a',
              border: '2px solid #555',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {digit}
          </button>
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <button
          onClick={() => handleClear(target)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#dc3545',
            border: '2px solid #dc3545',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          C
        </button>
        <button
          onClick={() => handleDigitClick('0', target)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#3a3a3a',
            border: '2px solid #555',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          0
        </button>
        <button
          onClick={() => handleBackspace(target)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#6c757d',
            border: '2px solid #6c757d',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ⌫
        </button>
      </div>
    </div>
  );

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

        {mode === 'import' && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#b0b0b0', marginBottom: '15px' }}>
              Private Key (JSON Array)
            </h4>
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="[123, 45, 67, ...]"
              style={{
                width: '100%',
                height: '100px',
                backgroundColor: '#3a3a3a',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                padding: '10px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        {renderPinInput(pin, 'pin', 'Enter 4-digit PIN')}

        {mode === 'create' && renderPinInput(confirmPin, 'confirm', 'Confirm PIN')}

        {error && (
          <div style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {mode === 'create' && pin !== confirmPin && confirmPin.length === 4 && (
          <div style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            PINs don't match
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
              pin.length !== 4 ||
              (mode === 'create' && (confirmPin.length !== 4 || pin !== confirmPin)) ||
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
              opacity: (
                pin.length !== 4 ||
                (mode === 'create' && (confirmPin.length !== 4 || pin !== confirmPin)) ||
                (mode === 'import' && !privateKey.trim())
              ) ? 0.5 : 1
            }}
          >
            {isLoading ? 'Processing...' : (mode === 'create' ? 'Create Wallet' : 'Import Wallet')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletSetup;
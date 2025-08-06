import React, { useState } from 'react';

interface PinSetupProps {
  onPinSetup: (pin: string) => Promise<boolean>;
  error?: string;
  isLoading?: boolean;
}

const PinSetup: React.FC<PinSetupProps> = ({
  onPinSetup,
  error,
  isLoading = false
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

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
    if (pin.length === 4 && confirmPin.length === 4 && pin === confirmPin) {
      await onPinSetup(pin);
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
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: index < value.length ? '#007bff' : '#3a3a3a',
              border: '2px solid #555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
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
        gap: '15px',
        marginBottom: '15px'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigitClick(digit.toString(), target)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#3a3a3a',
              border: '2px solid #555',
              color: '#fff',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3a3a3a';
            }}
          >
            {digit}
          </button>
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      }}>
        <button
          onClick={() => handleClear(target)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#dc3545',
            border: '2px solid #dc3545',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          C
        </button>
        <button
          onClick={() => handleDigitClick('0', target)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#3a3a3a',
            border: '2px solid #555',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#4a4a4a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3a3a3a';
          }}
        >
          0
        </button>
        <button
          onClick={() => handleBackspace(target)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#6c757d',
            border: '2px solid #6c757d',
            color: '#fff',
            fontSize: '16px',
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
        <h2 style={{ marginBottom: '20px', color: '#007bff' }}>
          Set Up Your PIN
        </h2>
        
        <p style={{ color: '#b0b0b0', marginBottom: '30px', fontSize: '14px' }}>
          Create a 4-digit PIN to secure your wallet. This PIN will be used to encrypt all your wallets.
        </p>

        {renderPinInput(pin, 'pin', 'Enter 4-digit PIN')}
        {renderPinInput(confirmPin, 'confirm', 'Confirm PIN')}

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

        {pin !== confirmPin && confirmPin.length === 4 && (
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

        <button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            pin.length !== 4 ||
            confirmPin.length !== 4 ||
            pin !== confirmPin
          }
          style={{
            padding: '15px 30px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: (
              pin.length !== 4 ||
              confirmPin.length !== 4 ||
              pin !== confirmPin
            ) ? 0.5 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isLoading ? 'Setting up...' : 'Set PIN'}
        </button>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#3a3a3a',
          borderRadius: '8px',
          border: '1px solid #555'
        }}>
          <p style={{ color: '#b0b0b0', fontSize: '12px', margin: 0 }}>
            ⚠️ <strong>Important:</strong> Remember your PIN! It will be required to access your wallet. 
            If you forget it, you'll need to reset and lose access to your current wallet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PinSetup;
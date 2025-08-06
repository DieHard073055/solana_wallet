import React, { useState } from 'react';

interface PinAuthProps {
  onPinEntered: (pin: string) => void;
  onCreateNew: () => void;
  onImportWallet: () => void;
  isUnlocking?: boolean;
  error?: string;
}

const PinAuth: React.FC<PinAuthProps> = ({ 
  onPinEntered, 
  onCreateNew, 
  onImportWallet, 
  isUnlocking = false,
  error 
}) => {
  const [pin, setPin] = useState('');

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          onPinEntered(newPin);
          setPin(''); // Clear PIN after submission
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
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
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ marginBottom: '30px', color: '#007bff' }}>
          {isUnlocking ? 'Enter PIN to unlock wallet' : 'Welcome to Solana Wallet'}
        </h2>

        {!isUnlocking && (
          <p style={{ color: '#b0b0b0', marginBottom: '30px' }}>
            Enter your 4-digit PIN to access your wallet, or create a new one
          </p>
        )}

        {/* PIN Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '30px'
        }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: index < pin.length ? '#007bff' : '#3a3a3a',
                border: '2px solid #555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff'
              }}
            >
              {index < pin.length ? '●' : ''}
            </div>
          ))}
        </div>

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


        {/* Number Pad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitClick(digit.toString())}
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

        {/* Bottom row with 0, backspace */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <button
            onClick={handleClear}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#dc3545',
              border: '2px solid #dc3545',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            C
          </button>
          
          <button
            onClick={() => handleDigitClick('0')}
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
            onClick={handleBackspace}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#6c757d',
              border: '2px solid #6c757d',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⌫
          </button>
        </div>

        {isUnlocking && (
          <div style={{
            borderTop: '1px solid #555',
            paddingTop: '20px'
          }}>
            <p style={{ color: '#b0b0b0', marginBottom: '15px', fontSize: '12px' }}>
              Having trouble? Clear all data and start fresh:
            </p>
            <button
              onClick={() => {
                if (confirm('This will delete all wallet data. Are you sure?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Reset All Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinAuth;
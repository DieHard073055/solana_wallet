import React, { useState } from 'react';
import VaultIcon from './VaultIcon';

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
    <div className="flex flex-col items-center justify-center" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-8)'
    }}>
      <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
        <div className="flex items-center justify-center mb-8">
          <VaultIcon size={48} className="text-gold" unlocking={isUnlocking} />
        </div>
        
        <h2 className="text-2xl font-semibold text-gold mb-12">
          {isUnlocking ? 'Unlock your vault' : 'Welcome to Thijoori'}
        </h2>

        {!isUnlocking && (
          <p className="text-secondary mb-12">
            Enter your 4-digit PIN to access your vault
          </p>
        )}

        {/* PIN Display */}
        <div className="flex justify-center gap-4 mb-12">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex items-center justify-center"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: index < pin.length ? 'var(--color-primary-gold)' : 'var(--color-surface-alt)',
                border: `2px solid ${index < pin.length ? 'var(--color-primary-gold)' : 'var(--color-divider)'}`,
                fontSize: '24px',
                color: index < pin.length ? 'var(--color-background)' : 'var(--color-text-muted)',
                transition: 'all var(--duration-fast) var(--ease)',
                boxShadow: index < pin.length ? 'var(--shadow-subtle)' : 'none'
              }}
            >
              {index < pin.length ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <div className="toast" style={{
            backgroundColor: 'var(--color-status-error)',
            color: 'white',
            padding: 'var(--spacing-6) var(--spacing-8)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-8)',
            boxShadow: 'var(--shadow-soft)'
          }}>
            {error}
          </div>
        )}


        {/* Number Pad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-8)',
          marginBottom: 'var(--spacing-8)'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              className="btn-ghost"
              onClick={() => handleDigitClick(digit.toString())}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-full)',
                fontSize: '20px',
                fontWeight: '600',
                border: '2px solid var(--color-divider)',
                color: 'var(--color-text-primary)'
              }}
            >
              {digit}
            </button>
          ))}
        </div>

        {/* Bottom row with 0, backspace */}
        <div className="flex justify-center gap-8 mb-12">
          <button
            className="btn btn-danger"
            onClick={handleClear}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-full)',
              fontSize: '16px',
              padding: 0
            }}
          >
            C
          </button>
          
          <button
            className="btn-ghost"
            onClick={() => handleDigitClick('0')}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-full)',
              fontSize: '20px',
              fontWeight: '600',
              border: '2px solid var(--color-divider)',
              color: 'var(--color-text-primary)',
              padding: 0
            }}
          >
            0
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleBackspace}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-full)',
              fontSize: '16px',
              padding: 0
            }}
          >
            ⌫
          </button>
        </div>

        {isUnlocking && (
          <div style={{
            borderTop: '1px solid var(--color-divider)',
            paddingTop: 'var(--spacing-8)'
          }}>
            <p className="text-muted text-xs mb-6">
              Having trouble? Clear all data and start fresh:
            </p>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (confirm('This will delete all wallet data. Are you sure?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Reset All Data
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default PinAuth;
import React, { useState } from 'react';
import VaultIcon from './VaultIcon';

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
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleDigitClick = (digit: string) => {
    if (step === 'enter' && pin.length < 4) {
      setPin(pin + digit);
    } else if (step === 'confirm' && confirmPin.length < 4) {
      setConfirmPin(confirmPin + digit);
    }
  };

  const handleBackspace = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (step === 'enter') {
      setPin('');
    } else {
      setConfirmPin('');
    }
  };

  const handleNext = () => {
    if (step === 'enter' && pin.length === 4) {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    }
  };

  const handleSubmit = async () => {
    if (step === 'confirm' && pin.length === 4 && confirmPin.length === 4 && pin === confirmPin) {
      await onPinSetup(pin);
    }
  };

  const renderPinInput = (value: string, label: string) => (
    <div style={{ marginBottom: 'var(--spacing-12)' }}>
      <h4 className="text-secondary" style={{ marginBottom: 'var(--spacing-8)', textAlign: 'center' }}>
        {label}
      </h4>
      <div className="flex justify-center gap-4 mb-12">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="flex items-center justify-center"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: index < value.length ? 'var(--color-primary-gold)' : 'var(--color-surface-alt)',
              border: `2px solid ${index < value.length ? 'var(--color-primary-gold)' : 'var(--color-divider)'}`,
              fontSize: '24px',
              color: index < value.length ? 'var(--color-background)' : 'var(--color-text-muted)',
              transition: 'all var(--duration-fast) var(--ease)',
              boxShadow: index < value.length ? 'var(--shadow-subtle)' : 'none'
            }}
          >
            {index < value.length ? '●' : ''}
          </div>
        ))}
      </div>
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
      <div className="flex justify-center gap-8">
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
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-8)'
    }}>
      <div className="card text-center" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body">
        <div className="flex items-center justify-center mb-8">
          <VaultIcon size={48} className="text-gold" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gold mb-8">
          Secure Your Vault
        </h2>
        
        <p className="text-secondary text-sm mb-12">
          {step === 'enter' 
            ? 'Create a 4-digit PIN to secure your vault. This PIN will encrypt all your assets.'
            : 'Please confirm your PIN by entering it again.'
          }
        </p>

        {step === 'enter' && renderPinInput(pin, 'Enter 4-digit PIN')}
        {step === 'confirm' && renderPinInput(confirmPin, 'Confirm PIN')}

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

        {step === 'confirm' && pin !== confirmPin && confirmPin.length === 4 && (
          <div className="toast" style={{
            backgroundColor: 'var(--color-status-error)',
            color: 'white',
            padding: 'var(--spacing-6) var(--spacing-8)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-8)',
            boxShadow: 'var(--shadow-soft)'
          }}>
            PINs don't match
          </div>
        )}

        <div className="flex gap-8 justify-center" style={{ flexWrap: 'wrap' }}>
          {step === 'confirm' && (
            <button
              className="btn btn-secondary btn-lg"
              onClick={handleBack}
            >
              Back
            </button>
          )}
          
          {step === 'enter' ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleNext}
              disabled={pin.length !== 4}
            >
              Next
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={
                isLoading ||
                confirmPin.length !== 4 ||
                pin !== confirmPin
              }
            >
              {isLoading ? 'Setting up...' : 'Set PIN'}
            </button>
          )}
        </div>

        <div className="card-alt" style={{
          marginTop: 'var(--spacing-8)',
          padding: 'var(--spacing-8)',
          border: '1px solid var(--color-divider)'
        }}>
          <p className="text-muted text-xs" style={{ margin: 0 }}>
            ⚠️ <strong>Important:</strong> Remember your PIN! It will be required to access your wallet. 
            If you forget it, you'll need to reset and lose access to your current wallet.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PinSetup;
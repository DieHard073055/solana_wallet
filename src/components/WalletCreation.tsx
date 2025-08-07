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
    <div className="flex flex-col items-center justify-center" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-8)'
    }}>
      <div className="card text-center" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body">
        <h2 className="text-2xl font-semibold text-gold mb-12">
          {mode === 'create' ? 'Create New Wallet' : 'Import Wallet'}
        </h2>

        {mode === 'create' && (
          <div style={{ marginBottom: 'var(--spacing-12)' }}>
            <p className="text-secondary mb-8">
              A new wallet will be generated and encrypted with your PIN.
            </p>
            <div className="card-alt" style={{
              border: '1px solid var(--color-divider)',
              padding: 'var(--spacing-8)'
            }}>
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                ⚠️ <strong>Important:</strong> Make sure to export and backup your private key after creation!
              </p>
            </div>
          </div>
        )}

        {mode === 'import' && (
          <div style={{ marginBottom: 'var(--spacing-12)' }}>
            <h4 className="text-secondary mb-8">
              Private Key (JSON Array)
            </h4>
            <textarea
              className="input input-mono"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter your private key as JSON array: [123, 45, 67, ...]"
              style={{
                height: '120px',
                resize: 'vertical'
              }}
            />
            <p className="text-muted text-xs" style={{ marginTop: 'var(--spacing-4)' }}>
              Paste your private key as a JSON array. It will be encrypted with your PIN.
            </p>
          </div>
        )}

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

        <div className="flex gap-8 justify-center" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={onBack}
          >
            Back
          </button>
          
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={
              isLoading || 
              (mode === 'import' && !privateKey.trim())
            }
          >
            {isLoading ? 'Processing...' : (mode === 'create' ? 'Create Wallet' : 'Import Wallet')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCreation;
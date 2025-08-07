import React, { useState } from 'react';
import { useBalance } from '../hooks/useBalance';
import { Connection } from '@solana/web3.js';
import { formatTokenAmount, shortenAddress } from '../utils/validation';
import QRCodeGenerator from './QRCodeGenerator';

interface BalanceDisplayProps {
  connection: Connection | null;
  publicKey: string | null;
  isConnected: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ connection, publicKey, isConnected }) => {
  const { solBalance, tokenBalances, allTokens, isLoading, error, refreshBalances } = useBalance(connection, publicKey);
  const [showQRCode, setShowQRCode] = useState(false);

  const formatBalance = (token: any) => {
    // For SOL (native token), display as SOL units
    if (token.mint === '11111111111111111111111111111112') {
      return (token.balance / 1000000000).toFixed(9) + ' ' + (token.symbol || 'SOL');
    }
    // For SPL tokens, use existing formatting
    return formatTokenAmount(token.balance, token.decimals);
  };

  if (!isConnected || !publicKey) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <h3 className="text-xl text-secondary mb-8">Account Balance</h3>
          <p className="text-muted">Connect your wallet to view balances</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-semibold text-primary">Vault Balance</h3>
          <div className="flex gap-4">
            <button 
              className={`btn btn-sm ${showQRCode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowQRCode(!showQRCode)}
            >
              {showQRCode ? 'Hide QR' : 'Show QR'}
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={refreshBalances}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="toast" style={{
            backgroundColor: 'var(--color-status-error)',
            color: 'white',
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-8)'
          }}>
            {error}
          </div>
        )}

        {showQRCode && publicKey && (
          <div className="card-alt text-center mb-8">
            <div className="card-body">
              <h4 className="text-lg font-medium text-gold mb-8">Your Vault Address</h4>
              <QRCodeGenerator value={publicKey} size={200} />
              <div className="input font-mono text-xs mt-8" style={{ 
                wordBreak: 'break-all',
                backgroundColor: 'var(--color-surface-alt)',
                border: '1px solid var(--color-divider)'
              }}>
                {publicKey}
              </div>
              <button
                className="btn btn-primary btn-sm mt-4"
                onClick={() => navigator.clipboard.writeText(publicKey)}
              >
                Copy Address
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-lg font-medium text-secondary mb-8">Asset Portfolio</h4>
          {allTokens.length === 0 ? (
            <div className="card-alt text-center">
              <div className="card-body">
                <p className="text-muted">No assets found in vault</p>
              </div>
            </div>
          ) : (
            <div className="card-alt" style={{ 
              maxHeight: '400px', 
              overflowY: 'auto'
            }}>
              {allTokens.map((token, index) => (
                <div 
                  key={token.mint} 
                  className="flex items-center gap-8"
                  style={{ 
                    padding: 'var(--spacing-8)', 
                    borderBottom: index < allTokens.length - 1 ? '1px solid var(--color-divider)' : 'none'
                  }}
                >
                  {token.logoURI && (
                    <img 
                      src={token.logoURI} 
                      alt={token.name || token.symbol || 'Token'}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-full)',
                        objectFit: 'cover',
                        backgroundColor: 'var(--color-surface)',
                        border: '2px solid var(--color-divider)',
                        boxShadow: 'var(--shadow-subtle)'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="mb-4">
                      <div className="text-base font-semibold text-primary">
                        {token.name || `Token ${shortenAddress(token.mint)}`}
                      </div>
                      {token.symbol && (
                        <div className="text-sm text-secondary">
                          {token.symbol}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-success font-mono">
                      {formatBalance(token)}
                    </div>
                    <div className="text-xs text-muted mt-2">
                      <strong>Mint:</strong> {shortenAddress(token.mint)}
                      <span 
                        className="text-gold"
                        style={{ 
                          marginLeft: 'var(--spacing-4)', 
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                        onClick={() => navigator.clipboard.writeText(token.mint)}
                        title="Click to copy full address"
                      >
                        (copy)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-xs text-muted text-center">
          <p>💡 Tip: Click on token mint addresses to copy the full address to clipboard</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceDisplay;
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
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
        <h3>Account Balance</h3>
        <p style={{ color: '#6c757d' }}>Connect your wallet to view balances</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Account Balance</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowQRCode(!showQRCode)}
            style={{ 
              padding: '8px 16px',
              backgroundColor: showQRCode ? '#28a745' : '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showQRCode ? 'Hide QR' : 'Show QR'}
          </button>
          <button 
            onClick={refreshBalances}
            disabled={isLoading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: isLoading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {showQRCode && publicKey && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '25px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px'
        }}>
          <h4 style={{ marginBottom: '15px', color: '#333' }}>Your Wallet Address</h4>
          <QRCodeGenerator value={publicKey} size={200} />
          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            wordBreak: 'break-all',
            fontSize: '12px',
            color: '#495057',
            fontFamily: 'monospace'
          }}>
            {publicKey}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(publicKey)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Copy Address
          </button>
        </div>
      )}

      <div>
        <h4>Token Balances</h4>
        {allTokens.length === 0 ? (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#3a3a3a', 
            border: '1px solid #555', 
            borderRadius: '4px',
            color: '#b0b0b0',
            textAlign: 'center'
          }}>
            No tokens found
          </div>
        ) : (
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid #555',
            borderRadius: '4px'
          }}>
            {allTokens.map((token, index) => (
              <div 
                key={token.mint} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < allTokens.length - 1 ? '1px solid #555' : 'none',
                  backgroundColor: index % 2 === 0 ? '#3a3a3a' : '#2a2a2a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}
              >
                {token.logoURI && (
                  <img 
                    src={token.logoURI} 
                    alt={token.name || token.symbol || 'Token'}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      backgroundColor: '#555',
                      border: '2px solid #666'
                    }}
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                      {token.name || `Token ${shortenAddress(token.mint)}`}
                    </div>
                    {token.symbol && (
                      <div style={{ fontSize: '14px', color: '#b0b0b0' }}>
                        {token.symbol}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {formatBalance(token)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b0b0b0', marginTop: '4px' }}>
                    <strong>Mint:</strong> {shortenAddress(token.mint)}
                    <span 
                      style={{ 
                        marginLeft: '10px', 
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

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
        <p>💡 Tip: Click on token mint addresses to copy the full address to clipboard</p>
      </div>
    </div>
  );
};

export default BalanceDisplay;
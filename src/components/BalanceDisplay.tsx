import React from 'react';
import { useBalance } from '../hooks/useBalance';
import { Connection } from '@solana/web3.js';
import { formatTokenAmount, shortenAddress } from '../utils/validation';

interface BalanceDisplayProps {
  connection: Connection | null;
  publicKey: string | null;
  isConnected: boolean;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ connection, publicKey, isConnected }) => {
  const { solBalance, tokenBalances, isLoading, error, refreshBalances } = useBalance(connection, publicKey);

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

      <div style={{ marginBottom: '25px' }}>
        <h4>SOL Balance</h4>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#3a3a3a', 
          border: '1px solid #555', 
          borderRadius: '4px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#fff'
        }}>
          {solBalance.toFixed(9)} SOL
        </div>
      </div>

      <div>
        <h4>SPL Token Balances</h4>
        {tokenBalances.length === 0 ? (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#3a3a3a', 
            border: '1px solid #555', 
            borderRadius: '4px',
            color: '#b0b0b0',
            textAlign: 'center'
          }}>
            No SPL tokens found
          </div>
        ) : (
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            border: '1px solid #555',
            borderRadius: '4px'
          }}>
            {tokenBalances.map((token, index) => (
              <div 
                key={token.mint} 
                style={{ 
                  padding: '15px', 
                  borderBottom: index < tokenBalances.length - 1 ? '1px solid #555' : 'none',
                  backgroundColor: index % 2 === 0 ? '#3a3a3a' : '#2a2a2a',
                  color: '#fff'
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>Mint:</strong> {shortenAddress(token.mint)}
                  <span 
                    style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px', 
                      color: '#b0b0b0',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    onClick={() => navigator.clipboard.writeText(token.mint)}
                    title="Click to copy full address"
                  >
                    (copy full)
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {formatTokenAmount(token.balance, token.decimals)} 
                  {token.symbol && ` ${token.symbol}`}
                </div>
                <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                  Decimals: {token.decimals}
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
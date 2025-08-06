import React from 'react';
import { Connection } from '@solana/web3.js';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { shortenAddress } from '../utils/validation';

interface TransactionHistoryProps {
  connection: Connection | null;
  publicKey: string | null;
  isConnected: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ connection, publicKey, isConnected }) => {
  const { transactions, isLoading, error, refreshHistory } = useTransactionHistory(connection, publicKey);

  const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return 'Pending';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: number): string => {
    if (amount === 0) return 'N/A';
    const sign = amount > 0 ? '+' : '';
    return `${sign}${amount.toFixed(9)} SOL`;
  };

  const getAmountColor = (amount: number): string => {
    if (amount === 0) return '#6c757d';
    return amount > 0 ? '#28a745' : '#dc3545';
  };

  if (!isConnected || !publicKey) {
    return (
      <div style={{ padding: '20px', border: '1px solid #555', borderRadius: '8px', margin: '10px 0', backgroundColor: '#242424' }}>
        <h3 style={{ color: '#fff' }}>Transaction History</h3>
        <p style={{ color: '#b0b0b0' }}>Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #555', borderRadius: '8px', margin: '10px 0', backgroundColor: '#242424' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#fff' }}>Transaction History</h3>
        <button 
          onClick={refreshHistory}
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
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#dc3545', 
          border: '1px solid #dc3545', 
          borderRadius: '4px',
          color: '#fff',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {transactions.length === 0 && !isLoading ? (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#3a3a3a', 
          border: '1px solid #555', 
          borderRadius: '4px',
          color: '#b0b0b0',
          textAlign: 'center'
        }}>
          No transactions found
        </div>
      ) : (
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #555',
          borderRadius: '4px'
        }}>
          {transactions.map((tx, index) => (
            <div 
              key={tx.signature} 
              style={{ 
                padding: '15px', 
                borderBottom: index < transactions.length - 1 ? '1px solid #555' : 'none',
                backgroundColor: index % 2 === 0 ? '#3a3a3a' : '#2a2a2a',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1, marginRight: '15px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Signature:</strong> {shortenAddress(tx.signature)}
                    <button 
                      onClick={() => navigator.clipboard.writeText(tx.signature)}
                      style={{ 
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: 'transparent',
                        border: '1px solid #b0b0b0',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        color: '#b0b0b0'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                    {formatDate(tx.blockTime)}
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: getAmountColor(tx.amount)
                }}>
                  {formatAmount(tx.amount)}
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                <span style={{ 
                  padding: '2px 6px',
                  backgroundColor: tx.type === 'SOL' ? '#007bff' : '#28a745',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}>
                  {tx.type}
                </span>
                {tx.mint && (
                  <span style={{ marginLeft: '8px' }}>
                    Mint: {shortenAddress(tx.mint)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#b0b0b0' }}>
        <p>💡 Showing recent transactions. Click "Copy" to copy full signature.</p>
        <p><strong>Note:</strong> Basic RPC provides limited transaction history. For full history with amounts and token transfers, consider using:</p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Helius RPC endpoint (free tier available)</li>
          <li>Solscan API for detailed transaction data</li>
          <li>Jupiter API for DeFi transaction parsing</li>
        </ul>
        <p>Current endpoint: {connection?.rpcEndpoint.includes('helius') ? '✅ Helius (Enhanced)' : '⚠️ Basic RPC (Limited)'}</p>
      </div>
    </div>
  );
};

export default TransactionHistory;
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
    if (amount === 0) return 'var(--color-text-muted)';
    return amount > 0 ? 'var(--color-status-success)' : 'var(--color-status-error)';
  };

  if (!isConnected || !publicKey) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <h3 className="text-xl text-secondary mb-8">Transaction History</h3>
          <p className="text-muted">Connect your vault to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-semibold text-primary">Transaction History</h3>
          <button 
            className="btn btn-primary btn-sm"
            onClick={refreshHistory}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="toast mb-8" style={{
            backgroundColor: 'var(--color-status-error)',
            color: 'white',
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {error}
          </div>
        )}

        {transactions.length === 0 && !isLoading ? (
          <div className="card-alt text-center">
            <div className="card-body">
              <p className="text-muted">No transactions found in vault</p>
            </div>
          </div>
        ) : (
          <div className="card-alt" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto'
          }}>
            {transactions.map((tx, index) => (
              <div 
                key={tx.signature} 
                style={{ 
                  padding: 'var(--spacing-8)', 
                  borderBottom: index < transactions.length - 1 ? '1px solid var(--color-divider)' : 'none'
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div style={{ flex: 1, marginRight: 'var(--spacing-8)' }}>
                    <div className="mb-2">
                      <strong className="text-secondary">Signature:</strong> 
                      <span className="font-mono text-sm text-primary ml-2">{shortenAddress(tx.signature)}</span>
                      <button 
                        className="btn btn-ghost btn-sm ml-2"
                        onClick={() => navigator.clipboard.writeText(tx.signature)}
                        style={{ 
                          padding: '2px 6px',
                          fontSize: '10px'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="text-xs text-muted">
                      {formatDate(tx.blockTime)}
                    </div>
                  </div>
                  <div className="text-right font-bold font-mono" style={{ 
                    color: getAmountColor(tx.amount)
                  }}>
                    {formatAmount(tx.amount)}
                  </div>
                </div>
                
                <div className="text-xs text-muted flex items-center gap-4">
                  <span style={{ 
                    padding: '2px 6px',
                    backgroundColor: tx.type === 'SOL' ? 'var(--color-primary-gold)' : 'var(--color-status-success)',
                    color: 'var(--color-background)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {tx.type}
                  </span>
                  {tx.mint && (
                    <span>
                      <strong>Mint:</strong> <span className="font-mono">{shortenAddress(tx.mint)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-xs text-muted" style={{ lineHeight: 'var(--line-height-relaxed)' }}>
          <p className="mb-2">💡 Showing recent transactions. Click "Copy" to copy full signature.</p>
          <p className="mb-2"><strong>Note:</strong> Basic RPC provides limited transaction history. For full history with amounts and token transfers, consider using:</p>
          <ul className="mb-2" style={{ paddingLeft: 'var(--spacing-8)' }}>
            <li>Helius RPC endpoint (free tier available)</li>
            <li>Solscan API for detailed transaction data</li>
            <li>Jupiter API for DeFi transaction parsing</li>
          </ul>
          <p>Current endpoint: <span className={connection?.rpcEndpoint.includes('helius') ? 'text-success' : 'text-warning'}>{connection?.rpcEndpoint.includes('helius') ? '✅ Helius (Enhanced)' : '⚠️ Basic RPC (Limited)'}</span></p>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
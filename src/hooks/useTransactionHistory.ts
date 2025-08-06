import { useState, useEffect } from 'react';
import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { TransactionRecord } from '../types/wallet';

export const useTransactionHistory = (connection: Connection | null, publicKey: string | null) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchTransactionHistory = async () => {
    if (!connection || !publicKey) return;

    setIsLoading(true);
    setError('');

    try {
      // Try to use Helius API if available, otherwise fall back to basic method
      const endpoint = connection.rpcEndpoint;
      const isHelius = endpoint.includes('helius');
      
      if (isHelius) {
        await fetchWithHelius(endpoint, publicKey);
      } else {
        await fetchWithBasicRPC(publicKey);
      }
    } catch (err: any) {
      console.error('Error fetching transaction history:', err);
      setError(`Failed to fetch transaction history: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithHelius = async (endpoint: string, publicKey: string) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'tx-history',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: publicKey,
          page: 1,
          limit: 20,
          displayOptions: {
            showFungible: true,
            showNativeBalance: true,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    // Process Helius response - this is simplified
    const transactions: TransactionRecord[] = [];
    setTransactions(transactions);
  };

  const fetchWithBasicRPC = async (publicKey: string) => {
    const pubKey = new PublicKey(publicKey);
    
    // Get signatures with reduced limit to avoid rate limiting
    const signatures = await connection!.getSignaturesForAddress(
      pubKey,
      { limit: 10 }
    );

    if (signatures.length === 0) {
      setTransactions([]);
      return;
    }

    // Process only a few recent transactions to avoid rate limits
    const limitedSignatures = signatures.slice(0, 5);
    
    const transactions: TransactionRecord[] = limitedSignatures.map((sig) => ({
      signature: sig.signature,
      blockTime: sig.blockTime || 0,
      amount: 0, // Simplified - would need full transaction parsing
      type: 'SOL' as const,
      mint: undefined,
    }));

    setTransactions(transactions);
  };

  const addRecentTransaction = (signature: string) => {
    const newTransaction: TransactionRecord = {
      signature,
      blockTime: Math.floor(Date.now() / 1000),
      amount: 0,
      type: 'SOL',
    };

    setTransactions(prev => [newTransaction, ...prev]);
  };

  useEffect(() => {
    if (connection && publicKey) {
      fetchTransactionHistory();
    } else {
      setTransactions([]);
    }
  }, [connection, publicKey]);

  return {
    transactions,
    isLoading,
    error,
    refreshHistory: fetchTransactionHistory,
    addRecentTransaction,
  };
};
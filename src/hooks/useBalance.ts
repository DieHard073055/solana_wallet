import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { TokenBalance } from '../types/wallet';

export const useBalance = (connection: Connection | null, publicKey: string | null) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchSOLBalance = async () => {
    if (!connection || !publicKey) return;

    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await connection.getBalance(pubKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch (err: any) {
      console.error('Error fetching SOL balance:', err);
      setError('Failed to fetch SOL balance');
    }
  };

  const fetchTokenBalances = async () => {
    if (!connection || !publicKey) return;

    try {
      const pubKey = new PublicKey(publicKey);
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const balances: TokenBalance[] = tokenAccounts.value.map((accountInfo) => {
        const data = accountInfo.account.data.parsed.info;
        return {
          mint: data.mint,
          balance: parseFloat(data.tokenAmount.amount),
          decimals: data.tokenAmount.decimals,
        };
      }).filter(balance => balance.balance > 0);

      setTokenBalances(balances);
    } catch (err: any) {
      console.error('Error fetching token balances:', err);
      setError('Failed to fetch token balances');
    }
  };

  const refreshBalances = async () => {
    if (!connection || !publicKey) return;

    setIsLoading(true);
    setError('');
    
    try {
      await Promise.all([
        fetchSOLBalance(),
        fetchTokenBalances(),
      ]);
    } catch (err: any) {
      setError('Failed to refresh balances');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connection && publicKey) {
      refreshBalances();
    } else {
      setSolBalance(0);
      setTokenBalances([]);
    }
  }, [connection, publicKey]);

  return {
    solBalance,
    tokenBalances,
    isLoading,
    error,
    refreshBalances,
  };
};
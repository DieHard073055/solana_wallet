import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { TokenBalance } from '../types/wallet';
import { getTokenMetadata } from '../utils/tokenMetadata';

export const useBalance = (connection: Connection | null, publicKey: string | null) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [allTokens, setAllTokens] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchSOLBalance = async () => {
    if (!connection || !publicKey) return;

    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await connection.getBalance(pubKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
      return balance / LAMPORTS_PER_SOL;
    } catch (err: any) {
      console.error('Error fetching SOL balance:', err);
      setError('Failed to fetch SOL balance');
      return 0;
    }
  };

  const fetchTokenBalances = async () => {
    if (!connection || !publicKey) return [];

    try {
      const pubKey = new PublicKey(publicKey);
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const balances: TokenBalance[] = await Promise.all(
        tokenAccounts.value
          .map((accountInfo) => {
            const data = accountInfo.account.data.parsed.info;
            return {
              mint: data.mint,
              balance: parseFloat(data.tokenAmount.amount),
              decimals: data.tokenAmount.decimals,
            };
          })
          .filter(balance => balance.balance > 0)
          .map(async (balance) => {
            // Fetch metadata for each token
            const metadata = await getTokenMetadata(balance.mint);
            return {
              ...balance,
              symbol: metadata?.symbol,
              name: metadata?.name,
              logoURI: metadata?.logoURI,
            };
          })
      );

      setTokenBalances(balances);
      return balances;
    } catch (err: any) {
      console.error('Error fetching token balances:', err);
      setError('Failed to fetch token balances');
      return [];
    }
  };

  const createUnifiedTokenList = async (solBal: number, splTokens: TokenBalance[]) => {
    // Create SOL token entry using metadata from the registry
    const solMetadata = await getTokenMetadata('11111111111111111111111111111112');
    
    const solToken: TokenBalance = {
      mint: '11111111111111111111111111111112', // System program ID (represents SOL)
      balance: solBal * LAMPORTS_PER_SOL, // Convert back to lamports for consistency
      decimals: 9,
      symbol: solMetadata?.symbol || 'SOL',
      name: solMetadata?.name || 'Solana',
      logoURI: solMetadata?.logoURI || 'https://s2.coinmarketcap.com/static/img/coins/128x128/5426.png' // Fallback to direct URL
    };
    
    // Combine SOL and SPL tokens, with SOL first
    const allTokensList = [solToken, ...splTokens];
    setAllTokens(allTokensList);
    return allTokensList;
  };

  const refreshBalances = async () => {
    if (!connection || !publicKey) return;

    setIsLoading(true);
    setError('');
    
    try {
      const [solBal, splTokens] = await Promise.all([
        fetchSOLBalance(),
        fetchTokenBalances(),
      ]);
      
      await createUnifiedTokenList(solBal || 0, splTokens || []);
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
      setAllTokens([]);
    }
  }, [connection, publicKey]);

  return {
    solBalance,
    tokenBalances,
    allTokens,
    isLoading,
    error,
    refreshBalances,
  };
};
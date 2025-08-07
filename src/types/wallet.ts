import { Keypair } from '@solana/web3.js';

export interface WalletState {
  keypair: Keypair | null;
  publicKey: string | null;
  isConnected: boolean;
}

export interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface TransactionRecord {
  signature: string;
  blockTime: number;
  amount: number;
  type: 'SOL' | 'SPL';
  mint?: string;
  from?: string;
  to?: string;
}

export interface ConnectionState {
  endpoint: string;
  isConnected: boolean;
  slot: number | null;
}
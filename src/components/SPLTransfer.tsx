import React, { useState } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { sendAndConfirmTransactionWithPolling } from '../utils/transactionUtils';
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { isValidSolanaAddress, isValidAmount, shortenAddress } from '../utils/validation';
import { useWallet } from '../hooks/useWallet';
import { TokenBalance } from '../types/wallet';
import QRCodeScanner from './QRCodeScanner';

interface SPLTransferProps {
  connection: Connection | null;
  tokenBalances: TokenBalance[];
  onTransactionComplete?: (signature: string) => void;
}

const SPLTransfer: React.FC<SPLTransferProps> = ({ connection, tokenBalances, onTransactionComplete }) => {
  const { wallet } = useWallet();
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [customMint, setCustomMint] = useState('');
  const [useCustomMint, setUseCustomMint] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransacting, setIsTransacting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const validateForm = (): boolean => {
    if (!recipient.trim()) {
      setError('Recipient address is required');
      return false;
    }

    if (!isValidSolanaAddress(recipient)) {
      setError('Invalid recipient address');
      return false;
    }

    if (useCustomMint && !customMint.trim()) {
      setError('Token mint address is required');
      return false;
    }

    if (useCustomMint && !isValidSolanaAddress(customMint)) {
      setError('Invalid token mint address');
      return false;
    }

    if (!useCustomMint && !selectedToken) {
      setError('Please select a token');
      return false;
    }

    if (!amount.trim()) {
      setError('Amount is required');
      return false;
    }

    if (!isValidAmount(amount)) {
      setError('Invalid amount');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    return true;
  };

  const handleQRScan = (scannedAddress: string) => {
    setRecipient(scannedAddress);
    setShowScanner(false);
    setError('');
  };

  const handleScanError = (error: string) => {
    setError(`QR Scan Error: ${error}`);
  };

  const handleTransfer = async () => {
    if (!connection || !wallet.keypair) {
      setError('Wallet not connected or connection not available');
      return;
    }

    if (!validateForm()) return;

    setIsTransacting(true);
    setError('');
    setSuccess('');

    try {
      const fromWallet = wallet.keypair;
      const toWallet = new PublicKey(recipient);
      
      let tokenMint: PublicKey;
      let decimals: number;
      
      if (useCustomMint) {
        tokenMint = new PublicKey(customMint);
        decimals = 9;
      } else if (selectedToken) {
        tokenMint = new PublicKey(selectedToken.mint);
        decimals = selectedToken.decimals;
      } else {
        throw new Error('No token selected');
      }

      const amountToSend = parseFloat(amount) * Math.pow(10, decimals);

      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        fromWallet.publicKey
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        toWallet
      );

      const transaction = new Transaction();

      const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
      if (!toTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromWallet.publicKey,
            toTokenAccount,
            toWallet,
            tokenMint
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromWallet.publicKey,
          amountToSend
        )
      );

      const signature = await sendAndConfirmTransactionWithPolling(
        connection,
        transaction,
        [fromWallet],
        { commitment: 'confirmed', pollingInterval: 2000 }
      );

      setSuccess(`Token transfer successful! Signature: ${signature}`);
      setRecipient('');
      setAmount('');
      setSelectedToken(null);
      setCustomMint('');
      
      if (onTransactionComplete) {
        onTransactionComplete(signature);
      }

    } catch (err: any) {
      console.error('SPL Transfer error:', err);
      setError(`Transaction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsTransacting(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
        <h3>Send SPL Token</h3>
        <p style={{ color: '#6c757d' }}>Connect your wallet to send SPL tokens</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <h3>Send SPL Token</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={useCustomMint}
              onChange={(e) => setUseCustomMint(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: 'bold' }}>Use custom token mint address</span>
          </label>
        </div>

        {useCustomMint ? (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Token Mint Address:
            </label>
            <input
              type="text"
              value={customMint}
              onChange={(e) => setCustomMint(e.target.value)}
              placeholder="Enter token mint address"
              style={{ 
                width: '100%', 
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Select Token:
            </label>
            <select
              value={selectedToken?.mint || ''}
              onChange={(e) => {
                const token = tokenBalances.find(t => t.mint === e.target.value);
                setSelectedToken(token || null);
              }}
              style={{ 
                width: '100%', 
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">Select a token...</option>
              {tokenBalances.map((token) => (
                <option key={token.mint} value={token.mint}>
                  {token.name || token.symbol || shortenAddress(token.mint)} (Balance: {(token.balance / Math.pow(10, token.decimals)).toFixed(token.decimals)})
                </option>
              ))}
            </select>
            {tokenBalances.length === 0 && (
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                No SPL tokens found. You can still send tokens using a custom mint address.
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Recipient Address:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient's Solana address"
              style={{ 
                flex: 1, 
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              style={{
                padding: '10px 15px',
                backgroundColor: showScanner ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              {showScanner ? '✕ Close' : '📷 Scan QR'}
            </button>
          </div>
          
          {showScanner && (
            <div style={{ marginTop: '15px' }}>
              <QRCodeScanner
                isActive={showScanner}
                onScan={handleQRScan}
                onError={handleScanError}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Amount:
          </label>
          <input
            type="number"
            step="0.000000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {selectedToken && (
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              Available: {(selectedToken.balance / Math.pow(10, selectedToken.decimals)).toFixed(selectedToken.decimals)}
            </p>
          )}
        </div>

        <button 
          onClick={handleTransfer}
          disabled={isTransacting || !connection}
          style={{ 
            width: '100%',
            padding: '12px',
            backgroundColor: isTransacting ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isTransacting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isTransacting ? 'Sending...' : 'Send Token'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '15px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px',
          color: '#155724',
          wordBreak: 'break-all'
        }}>
          <strong>Success:</strong> {success}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#6c757d' }}>
        <p><strong>Note:</strong> If the recipient doesn't have a token account, one will be created automatically</p>
        <p><strong>Tip:</strong> Custom mint transfers assume 9 decimals unless you know the exact decimals</p>
      </div>
    </div>
  );
};

export default SPLTransfer;
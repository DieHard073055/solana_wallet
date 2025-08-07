import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { isValidSolanaAddress, isValidAmount, shortenAddress, formatTokenAmount } from '../utils/validation';
import { useWallet } from '../hooks/useWallet';
import { TokenBalance } from '../types/wallet';
import QRCodeScanner from './QRCodeScanner';

interface UnifiedTransferProps {
  connection: Connection | null;
  allTokens: TokenBalance[];
  onTransactionComplete?: (signature: string) => void;
}

const UnifiedTransfer: React.FC<UnifiedTransferProps> = ({ connection, allTokens, onTransactionComplete }) => {
  const { wallet } = useWallet();
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
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

    if (!selectedToken) {
      setError('Please select a token to send');
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

    // Check if user has enough balance
    const availableBalance = selectedToken.mint === '11111111111111111111111111111112' 
      ? selectedToken.balance / LAMPORTS_PER_SOL
      : selectedToken.balance / Math.pow(10, selectedToken.decimals);
    
    if (amountNum > availableBalance) {
      setError(`Insufficient balance. Available: ${availableBalance.toFixed(selectedToken.decimals)} ${selectedToken.symbol || 'tokens'}`);
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

  const getTokenBalance = (token: TokenBalance): number => {
    if (token.mint === '11111111111111111111111111111112') {
      // SOL native token
      return token.balance / LAMPORTS_PER_SOL;
    }
    // SPL Token
    return token.balance / Math.pow(10, token.decimals);
  };

  const getTokenSymbol = (token: TokenBalance): string => {
    return token.symbol || (token.mint === '11111111111111111111111111111112' ? 'SOL' : 'TOKEN');
  };

  const handleSOLTransfer = async () => {
    if (!connection || !wallet.keypair || !selectedToken) return;

    const fromPubkey = wallet.keypair.publicKey;
    const toPubkey = new PublicKey(recipient);
    const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

    // Check if recipient account exists
    let recipientAccountInfo;
    try {
      recipientAccountInfo = await connection.getAccountInfo(toPubkey);
    } catch (error) {
      console.log('Error getting recipient account info:', error);
      recipientAccountInfo = null;
    }

    let finalLamports = lamports;
    const minimumRentExempt = await connection.getMinimumBalanceForRentExemption(0);

    // If account doesn't exist or has very low balance, ensure we send enough for rent exemption
    if (!recipientAccountInfo || recipientAccountInfo.lamports < minimumRentExempt) {
      finalLamports = Math.max(lamports, minimumRentExempt);
    }

    // Check sender's balance to ensure they have enough funds
    const senderBalance = await connection.getBalance(fromPubkey);
    const estimatedFee = 5000; // Approximate transaction fee in lamports
    
    if (senderBalance < finalLamports + estimatedFee) {
      throw new Error(`Insufficient funds. You need at least ${(finalLamports + estimatedFee) / LAMPORTS_PER_SOL} SOL (including fees), but you have ${senderBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Create the transaction
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: finalLamports,
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.keypair],
      { commitment: 'confirmed' }
    );

    const actualAmountSent = finalLamports / LAMPORTS_PER_SOL;
    let successMessage = `SOL transfer successful! Signature: ${signature}`;
    
    if (finalLamports > lamports) {
      successMessage += ` (Sent ${actualAmountSent.toFixed(9)} SOL to ensure account rent exemption)`;
    }

    return successMessage;
  };

  const handleSPLTransfer = async () => {
    if (!connection || !wallet.keypair || !selectedToken) return;

    const fromWallet = wallet.keypair;
    const toWallet = new PublicKey(recipient);
    const tokenMint = new PublicKey(selectedToken.mint);
    const amountToSend = parseFloat(amount) * Math.pow(10, selectedToken.decimals);

    const fromTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      fromWallet.publicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      toWallet
    );

    const transaction = new Transaction();

    // Check if recipient's token account exists, create if not
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

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromWallet.publicKey,
        amountToSend
      )
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromWallet],
      { commitment: 'confirmed' }
    );

    return `${getTokenSymbol(selectedToken)} transfer successful! Signature: ${signature}`;
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
      let successMessage: string;

      if (selectedToken!.mint === '11111111111111111111111111111112') {
        // Handle SOL transfer
        successMessage = await handleSOLTransfer();
      } else {
        // Handle SPL token transfer
        successMessage = await handleSPLTransfer();
      }

      setSuccess(successMessage);
      setRecipient('');
      setAmount('');
      setSelectedToken(null);
      
      if (onTransactionComplete) {
        onTransactionComplete(successMessage.match(/Signature: (\w+)/)?.[1] || '');
      }

    } catch (err: any) {
      console.error('Transfer error:', err);
      
      let errorMessage = 'Unknown error';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.toString) {
        errorMessage = err.toString();
      }
      
      // Add specific handling for common Solana errors
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to complete transfer (including transaction fees)';
      } else if (errorMessage.includes('account not found')) {
        errorMessage = 'Account lookup failed. Please check the recipient address.';
      } else if (errorMessage.includes('blockhash not found')) {
        errorMessage = 'Network issue: Transaction expired. Please try again.';
      }
      
      setError(`Transaction failed: ${errorMessage}`);
    } finally {
      setIsTransacting(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
        <h3>Send Tokens</h3>
        <p style={{ color: '#6c757d' }}>Connect your wallet to send tokens</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <h3>Send Tokens</h3>
      
      <div style={{ marginBottom: '20px' }}>
        {/* Token Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Select Token:
          </label>
          <select
            value={selectedToken?.mint || ''}
            onChange={(e) => {
              const token = allTokens.find(t => t.mint === e.target.value);
              setSelectedToken(token || null);
              setAmount(''); // Reset amount when token changes
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
            {allTokens.map((token) => (
              <option key={token.mint} value={token.mint}>
                {getTokenSymbol(token)} - {token.name || shortenAddress(token.mint)} (Balance: {getTokenBalance(token).toFixed(token.decimals)})
              </option>
            ))}
          </select>
          {allTokens.length === 0 && (
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              No tokens found. Please check your wallet balance.
            </p>
          )}
        </div>

        {/* Recipient Address */}
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

        {/* Amount */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Amount{selectedToken ? ` (${getTokenSymbol(selectedToken)})` : ''}:
          </label>
          <input
            type="number"
            step={selectedToken ? `${1 / Math.pow(10, selectedToken.decimals)}` : "0.000000001"}
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={selectedToken ? `Enter amount in ${getTokenSymbol(selectedToken)}` : "Select a token first"}
            disabled={!selectedToken}
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: !selectedToken ? '#f5f5f5' : 'white'
            }}
          />
          {selectedToken && (
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              Available: {getTokenBalance(selectedToken).toFixed(selectedToken.decimals)} {getTokenSymbol(selectedToken)}
            </p>
          )}
        </div>

        <button 
          onClick={handleTransfer}
          disabled={isTransacting || !connection || !selectedToken}
          style={{ 
            width: '100%',
            padding: '12px',
            backgroundColor: (isTransacting || !selectedToken) ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isTransacting || !selectedToken) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isTransacting ? 'Sending...' : selectedToken ? `Send ${getTokenSymbol(selectedToken)}` : 'Select Token First'}
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
        <p><strong>Note:</strong> Transaction fees will be deducted from your SOL balance</p>
        <p><strong>Tip:</strong> Double-check the recipient address and amount before sending</p>
        {selectedToken?.mint === '11111111111111111111111111111112' && (
          <p><strong>SOL Transfers:</strong> Amount may be automatically increased to meet minimum rent exemption requirements for dormant accounts</p>
        )}
        {selectedToken?.mint !== '11111111111111111111111111111112' && (
          <p><strong>Token Transfers:</strong> If the recipient doesn't have a token account, one will be created automatically</p>
        )}
      </div>
    </div>
  );
};

export default UnifiedTransfer;
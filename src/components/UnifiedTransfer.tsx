import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { sendAndConfirmTransactionWithPolling } from '../utils/transactionUtils';
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

    const signature = await sendAndConfirmTransactionWithPolling(
      connection,
      transaction,
      [wallet.keypair],
      { commitment: 'confirmed', pollingInterval: 2000 }
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

    const signature = await sendAndConfirmTransactionWithPolling(
      connection,
      transaction,
      [fromWallet],
      { commitment: 'confirmed', pollingInterval: 2000 }
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
      <div className="card">
        <div className="card-body text-center">
          <h3 className="text-xl text-secondary mb-8">Send Assets</h3>
          <p className="text-muted">Connect your vault to send assets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-xl font-semibold text-primary mb-8">Send Assets</h3>
        
        <div className="mb-8">
          {/* Token Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-secondary mb-4">
              Select Asset:
            </label>
            <select
              className="input"
              value={selectedToken?.mint || ''}
              onChange={(e) => {
                const token = allTokens.find(t => t.mint === e.target.value);
                setSelectedToken(token || null);
                setAmount('');
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
              <p className="text-xs text-muted mt-2">
                No assets found. Please check your vault balance.
              </p>
            )}
          </div>

          {/* Recipient Address */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-secondary mb-4">
              Recipient Address:
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                className="input font-mono"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter recipient's Solana address"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className={`btn ${showScanner ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setShowScanner(!showScanner)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showScanner ? '✕ Close' : '📷 Scan QR'}
              </button>
            </div>
            
            {showScanner && (
              <div className="mt-8">
                <QRCodeScanner
                  isActive={showScanner}
                  onScan={handleQRScan}
                  onError={handleScanError}
                />
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-secondary mb-4">
              Amount{selectedToken ? ` (${getTokenSymbol(selectedToken)})` : ''}:
            </label>
            <input
              type="number"
              className="input font-mono"
              step={selectedToken ? `${1 / Math.pow(10, selectedToken.decimals)}` : "0.000000001"}
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={selectedToken ? `Enter amount in ${getTokenSymbol(selectedToken)}` : "Select an asset first"}
              disabled={!selectedToken}
              style={{
                backgroundColor: !selectedToken ? 'var(--color-surface-alt)' : 'var(--color-surface-alt)',
                opacity: !selectedToken ? 0.6 : 1
              }}
            />
            {selectedToken && (
              <p className="text-xs text-muted mt-2">
                Available: <span className="font-mono text-success">{getTokenBalance(selectedToken).toFixed(selectedToken.decimals)} {getTokenSymbol(selectedToken)}</span>
              </p>
            )}
          </div>

          <button 
            className="btn btn-primary btn-lg"
            onClick={handleTransfer}
            disabled={isTransacting || !connection || !selectedToken}
            style={{ width: '100%' }}
          >
            {isTransacting ? 'Sending...' : selectedToken ? `Send ${getTokenSymbol(selectedToken)}` : 'Select Asset First'}
          </button>
        </div>

        {error && (
          <div className="toast mb-8" style={{
            backgroundColor: 'var(--color-status-error)',
            color: 'white',
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="toast success mb-8" style={{
            backgroundColor: 'var(--color-status-success)',
            color: 'white',
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--radius-sm)',
            wordBreak: 'break-all'
          }}>
            <strong>Success:</strong> {success}
          </div>
        )}

        <div className="mt-8 text-xs text-muted" style={{ lineHeight: 'var(--line-height-relaxed)' }}>
          <p className="mb-2"><strong>Note:</strong> Transaction fees will be deducted from your SOL balance</p>
          <p className="mb-2"><strong>Tip:</strong> Double-check the recipient address and amount before sending</p>
          {selectedToken?.mint === '11111111111111111111111111111112' && (
            <p className="mb-2"><strong>SOL Transfers:</strong> Amount may be automatically increased to meet minimum rent exemption requirements for dormant accounts</p>
          )}
          {selectedToken?.mint !== '11111111111111111111111111111112' && (
            <p className="mb-2"><strong>Token Transfers:</strong> If the recipient doesn't have a token account, one will be created automatically</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedTransfer;
import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { sendAndConfirmTransactionWithPolling } from '../utils/transactionUtils';
import { isValidSolanaAddress, isValidAmount } from '../utils/validation';
import { useWallet } from '../hooks/useWallet';
import QRCodeScanner from './QRCodeScanner';

interface SOLTransferProps {
  connection: Connection | null;
  onTransactionComplete?: (signature: string) => void;
}

const SOLTransfer: React.FC<SOLTransferProps> = ({ connection, onTransactionComplete }) => {
  const { wallet } = useWallet();
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
      const fromPubkey = wallet.keypair.publicKey;
      const toPubkey = new PublicKey(recipient);
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      // Check if recipient account exists and get its balance
      let recipientAccountInfo;
      try {
        recipientAccountInfo = await connection.getAccountInfo(toPubkey);
      } catch (error) {
        console.log('Error getting recipient account info:', error);
        recipientAccountInfo = null;
      }

      let finalLamports = lamports;

      // Always get the minimum rent exemption amount for account creation
      const minimumRentExempt = await connection.getMinimumBalanceForRentExemption(0);
      console.log(`Minimum rent exemption: ${minimumRentExempt} lamports (${minimumRentExempt / LAMPORTS_PER_SOL} SOL)`);

      // If account doesn't exist or has very low balance, ensure we send enough for rent exemption
      if (!recipientAccountInfo || recipientAccountInfo.lamports < minimumRentExempt) {
        // Always ensure we send at least the minimum rent exemption amount
        finalLamports = Math.max(lamports, minimumRentExempt);
        console.log(`Account is dormant/non-existent. Adjusting transfer amount from ${lamports} to ${finalLamports} lamports`);
        console.log(`Original amount: ${lamports / LAMPORTS_PER_SOL} SOL, Final amount: ${finalLamports / LAMPORTS_PER_SOL} SOL`);
      } else {
        console.log(`Account exists with balance: ${recipientAccountInfo.lamports} lamports`);
      }

      // Check sender's balance to ensure they have enough funds
      const senderBalance = await connection.getBalance(fromPubkey);
      const estimatedFee = 5000; // Approximate transaction fee in lamports
      
      console.log(`Sender balance: ${senderBalance} lamports (${senderBalance / LAMPORTS_PER_SOL} SOL)`);
      console.log(`Amount to send: ${finalLamports} lamports (${finalLamports / LAMPORTS_PER_SOL} SOL)`);
      console.log(`Estimated fee: ${estimatedFee} lamports (${estimatedFee / LAMPORTS_PER_SOL} SOL)`);
      console.log(`Total needed: ${finalLamports + estimatedFee} lamports (${(finalLamports + estimatedFee) / LAMPORTS_PER_SOL} SOL)`);
      
      if (senderBalance < finalLamports + estimatedFee) {
        throw new Error(`Insufficient funds. You need at least ${(finalLamports + estimatedFee) / LAMPORTS_PER_SOL} SOL (including fees), but you have ${senderBalance / LAMPORTS_PER_SOL} SOL`);
      }

      // Create the transaction with appropriate instructions
      const transaction = new Transaction();

      // If the account doesn't exist, we just need to send SOL to create it
      // The transfer instruction will automatically create the account
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: finalLamports,
        })
      );

      console.log(`About to send transaction...`);
      console.log(`From: ${fromPubkey.toString()}`);
      console.log(`To: ${toPubkey.toString()}`);
      console.log(`Amount: ${finalLamports} lamports`);

      const signature = await sendAndConfirmTransactionWithPolling(
        connection,
        transaction,
        [wallet.keypair],
        { commitment: 'confirmed', pollingInterval: 2000 }
      );

      console.log(`Transaction successful! Signature: ${signature}`);

      // Verify the transfer by checking recipient balance after transaction
      try {
        const newRecipientBalance = await connection.getBalance(toPubkey);
        console.log(`Recipient balance after transfer: ${newRecipientBalance} lamports (${newRecipientBalance / LAMPORTS_PER_SOL} SOL)`);
        
        if (recipientAccountInfo) {
          const balanceIncrease = newRecipientBalance - recipientAccountInfo.lamports;
          console.log(`Balance increased by: ${balanceIncrease} lamports (${balanceIncrease / LAMPORTS_PER_SOL} SOL)`);
        }
      } catch (error) {
        console.error('Error checking recipient balance after transfer:', error);
      }

      const actualAmountSent = finalLamports / LAMPORTS_PER_SOL;
      let successMessage = `Transaction successful! Signature: ${signature}`;
      
      if (finalLamports > lamports) {
        successMessage += ` (Sent ${actualAmountSent.toFixed(9)} SOL to ensure account rent exemption)`;
      }

      setSuccess(successMessage);
      setRecipient('');
      setAmount('');
      
      if (onTransactionComplete) {
        onTransactionComplete(signature);
      }

    } catch (err: any) {
      console.error('Transfer error:', err);
      console.error('Full error object:', err);
      
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
        <h3>Send SOL</h3>
        <p style={{ color: '#6c757d' }}>Connect your wallet to send SOL</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <h3>Send SOL</h3>
      
      <div style={{ marginBottom: '20px' }}>
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
            Amount (SOL):
          </label>
          <input
            type="number"
            step="0.000000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000000000"
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
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
          {isTransacting ? 'Sending...' : 'Send SOL'}
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
        <p><strong>Note:</strong> Transaction fees will be deducted from your balance</p>
        <p><strong>Tip:</strong> Double-check the recipient address before sending</p>
        <p><strong>Auto-adjustment:</strong> When sending to dormant accounts, the amount may be automatically increased to meet minimum rent exemption requirements</p>
      </div>
    </div>
  );
};

export default SOLTransfer;
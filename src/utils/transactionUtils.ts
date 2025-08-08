import { Connection, Transaction, Signer, TransactionSignature, Commitment } from '@solana/web3.js';

interface SendAndConfirmOptions {
  commitment?: Commitment;
  maxRetries?: number;
  pollingInterval?: number;
}

export async function sendAndConfirmTransactionWithPolling(
  connection: Connection,
  transaction: Transaction,
  signers: Signer[],
  options: SendAndConfirmOptions = {}
): Promise<TransactionSignature> {
  const {
    commitment = 'confirmed',
    maxRetries = 30,
    pollingInterval = 2000
  } = options;

  // Send the transaction
  const signature = await connection.sendTransaction(transaction, signers, {
    skipPreflight: false,
    preflightCommitment: commitment,
  });

  console.log('Transaction sent, signature:', signature);

  // Poll for confirmation using HTTP requests
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const status = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });

      if (status?.value?.confirmationStatus === commitment || 
          status?.value?.confirmationStatus === 'finalized') {
        if (status.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
        console.log(`Transaction confirmed after ${retries + 1} attempts`);
        return signature;
      }

      if (status?.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
      }

      console.log(`Polling attempt ${retries + 1}/${maxRetries}, status:`, status?.value?.confirmationStatus || 'pending');
    } catch (error) {
      console.warn(`Polling attempt ${retries + 1} failed:`, error);
    }

    retries++;
    if (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
  }

  throw new Error(`Transaction confirmation timeout after ${maxRetries} attempts`);
}
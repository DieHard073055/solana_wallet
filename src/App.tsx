import React, { useState } from 'react'
import './App.css'
import WalletManager from './components/WalletManager'
import ConnectionManager from './components/ConnectionManager'
import BalanceDisplay from './components/BalanceDisplay'
import SOLTransfer from './components/SOLTransfer'
import SPLTransfer from './components/SPLTransfer'
import TransactionHistory from './components/TransactionHistory'
import PinAuth from './components/PinAuth'
import PinSetup from './components/PinSetup'
import WalletCreation from './components/WalletCreation'
import { useWallet } from './hooks/useWallet'
import { useConnection } from './hooks/useConnection'
import { useBalance } from './hooks/useBalance'
import { useTransactionHistory } from './hooks/useTransactionHistory'

function App() {
  const { 
    wallet, 
    authState, 
    setupPin,
    unlockWallet, 
    generateWallet, 
    importWalletFromString,
    lockWallet,
    resetAll
  } = useWallet();
  const { connection, connectionState } = useConnection();
  const { tokenBalances } = useBalance(connection, wallet.publicKey);
  const { addRecentTransaction } = useTransactionHistory(connection, wallet.publicKey);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'history' | 'wallet' | 'network'>('overview');
  const [walletCreationMode, setWalletCreationMode] = useState<'create' | 'import' | null>(null);

  const handleTransactionComplete = (signature: string) => {
    addRecentTransaction(signature);
  };

  const handlePinSetup = async (pin: string) => {
    return await setupPin(pin);
  };

  const handlePinEntered = async (pin: string) => {
    return await unlockWallet(pin);
  };

  const handleCreateWallet = async () => {
    const success = await generateWallet();
    if (success) {
      setWalletCreationMode(null);
    }
    return success;
  };

  const handleImportWallet = async (privateKey: string) => {
    const success = await importWalletFromString(privateKey);
    if (success) {
      setWalletCreationMode(null);
    }
    return success;
  };

  // Show loading screen
  if (authState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #3a3a3a',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Show PIN setup for first-time users
  if (authState.needsPinSetup) {
    return (
      <PinSetup
        onPinSetup={handlePinSetup}
        isLoading={authState.isLoading}
        error={authState.error || undefined}
      />
    );
  }

  // Show PIN authentication
  if (authState.needsAuth) {
    return (
      <PinAuth
        onPinEntered={handlePinEntered}
        onCreateNew={() => {}}  // Not used in this flow
        onImportWallet={() => {}} // Not used in this flow
        isUnlocking={true}
        error={authState.error || undefined}
      />
    );
  }

  // Show wallet creation screens
  if (walletCreationMode) {
    return (
      <WalletCreation
        mode={walletCreationMode}
        onCreateWallet={handleCreateWallet}
        onImportWallet={handleImportWallet}
        onBack={() => setWalletCreationMode(null)}
        isLoading={authState.isLoading}
        error={authState.error || undefined}
      />
    );
  }

  // Show wallet creation options if PIN is unlocked but no wallet exists
  if (!authState.hasWallet && !authState.needsAuth && !authState.needsPinSetup) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#242424',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#007bff' }}>
            Welcome to Solana Wallet
          </h2>
          <p style={{ color: '#b0b0b0', marginBottom: '30px' }}>
            Your PIN is set up! Now create or import a wallet to get started.
          </p>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setWalletCreationMode('create')}
              style={{
                padding: '15px 25px',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Create New Wallet
            </button>
            <button
              onClick={() => setWalletCreationMode('import')}
              style={{
                padding: '15px 25px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Import Wallet
            </button>
          </div>

          <div style={{
            marginTop: '30px',
            borderTop: '1px solid #555',
            paddingTop: '20px'
          }}>
            <button
              onClick={() => {
                if (confirm('This will reset your PIN and all data. Are you sure?')) {
                  resetAll();
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1a1a1a',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px',
        backgroundColor: '#242424',
        minHeight: '100vh',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
      }}>
        <header style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          borderBottom: '2px solid #007bff',
          paddingBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              color: '#007bff', 
              margin: '0',
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              Solana Wallet
            </h1>
            <p style={{ 
              color: '#b0b0b0', 
              margin: '10px 0 0 0',
              fontSize: '1.1rem'
            }}>
              Manage your SOL and SPL tokens
            </p>
          </div>
          <button
            onClick={lockWallet}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔒 Lock
          </button>
        </header>

        <nav style={{ 
          marginBottom: '20px',
          borderBottom: '1px solid #555'
        }}>
          <div style={{ display: 'flex', gap: '0', overflowX: 'auto' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'send', label: 'Send' },
              { id: 'history', label: 'History' },
              { id: 'wallet', label: 'Wallet' },
              { id: 'network', label: 'Network' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#b0b0b0',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '3px solid #007bff' : '3px solid transparent',
                  fontSize: '16px',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div style={{ minHeight: '500px' }}>
          {activeTab === 'overview' && wallet.isConnected && connectionState.isConnected && (
            <BalanceDisplay 
              connection={connection}
              publicKey={wallet.publicKey}
              isConnected={wallet.isConnected}
            />
          )}

          {activeTab === 'send' && wallet.isConnected && connectionState.isConnected && (
            <div style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr'
            }}>
              <SOLTransfer 
                connection={connection}
                onTransactionComplete={handleTransactionComplete}
              />
              <SPLTransfer 
                connection={connection}
                tokenBalances={tokenBalances}
                onTransactionComplete={handleTransactionComplete}
              />
            </div>
          )}

          {activeTab === 'history' && wallet.isConnected && connectionState.isConnected && (
            <TransactionHistory 
              connection={connection}
              publicKey={wallet.publicKey}
              isConnected={wallet.isConnected}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletManager />
          )}

          {activeTab === 'network' && (
            <ConnectionManager />
          )}

          {(activeTab === 'overview' || activeTab === 'send' || activeTab === 'history') && 
           (!wallet.isConnected || !connectionState.isConnected) && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              backgroundColor: '#3a3a3a',
              borderRadius: '8px',
              border: '1px solid #555'
            }}>
              <h3 style={{ color: '#b0b0b0', marginBottom: '15px' }}>
                {!wallet.isConnected ? 'Wallet Not Connected' : 'Network Not Connected'}
              </h3>
              <p style={{ color: '#b0b0b0', marginBottom: '20px' }}>
                {!wallet.isConnected 
                  ? 'Go to the Wallet tab to manage your wallet'
                  : 'Go to the Network tab to configure your connection'
                }
              </p>
              <button
                onClick={() => setActiveTab(!wallet.isConnected ? 'wallet' : 'network')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Go to {!wallet.isConnected ? 'Wallet' : 'Network'} Tab
              </button>
            </div>
          )}
        </div>

        <footer style={{ 
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #dee2e6',
          textAlign: 'center',
          color: '#6c757d',
          fontSize: '14px'
        }}>
          <p>⚠️ This is a demo wallet. Never use real funds on untrusted applications.</p>
          <p style={{ marginTop: '10px' }}>
            Built with React, TypeScript, and @solana/web3.js
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App

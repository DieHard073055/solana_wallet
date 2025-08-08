import React, { useState, useEffect } from 'react'
import './design-system.css'
import './App.css'
import WalletManager from './components/WalletManager'
import VaultIcon from './components/VaultIcon'
import ConnectionManager from './components/ConnectionManager'
import BalanceDisplay from './components/BalanceDisplay'
import UnifiedTransfer from './components/UnifiedTransfer'
import TransactionHistory from './components/TransactionHistory'
import ContactsManager from './components/ContactsManager'
import PinAuth from './components/PinAuth'
import PinSetup from './components/PinSetup'
import WalletCreation from './components/WalletCreation'
import { useWallet } from './hooks/useWallet'
import { useConnection } from './hooks/useConnection'
import { useBalance } from './hooks/useBalance'
import { useTransactionHistory } from './hooks/useTransactionHistory'

const quotes = [
  "No branches. No forms. No nonsense.",
  "Our vault opens faster than their doors ever will.",
  "Your money. Your rules. Your vault.",
  "Banks had their turn. Now it's ours.",
  "Breaking chains, one transaction at a time.",
  "We don't ask permission to move your money.",
  "Power to the wallet, not the banker.",
  "If they block the door, we build our own vault."
];

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
  const { allTokens } = useBalance(connection, wallet.publicKey);
  const { addRecentTransaction } = useTransactionHistory(connection, wallet.publicKey);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'history' | 'contacts' | 'wallet' | 'network'>('overview');
  const [walletCreationMode, setWalletCreationMode] = useState<'create' | 'import' | null>(null);
  const [currentQuote, setCurrentQuote] = useState('');

  useEffect(() => {
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      return quotes[randomIndex];
    };

    setCurrentQuote(getRandomQuote());
  }, []);

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
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="spinner" style={{ margin: '0 auto var(--spacing-8)' }}></div>
          <p className="text-secondary">Unlocking vault...</p>
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
      <div className="flex flex-col items-center justify-center" style={{ 
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        padding: 'var(--spacing-8)'
      }}>
        <div className="card text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-body">
            <div className="flex items-center justify-center mb-8">
              <VaultIcon size={48} className="text-gold" unlocking />
            </div>
            <h2 className="text-2xl font-semibold text-gold mb-8">
              Welcome to Thijoori
            </h2>
            <p className="text-secondary mb-12">
              Your vault is ready! Create or import a wallet to secure your assets.
            </p>
            
            <div className="flex gap-8 justify-center" style={{ flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setWalletCreationMode('create')}
              >
                Create New Wallet
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setWalletCreationMode('import')}
              >
                Import Wallet
              </button>
            </div>

            <div style={{
              marginTop: 'var(--spacing-16)',
              borderTop: '1px solid var(--color-divider)',
              paddingTop: 'var(--spacing-8)'
            }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  if (confirm('This will reset your PIN and all data. Are you sure?')) {
                    resetAll();
                  }
                }}
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--color-background)'
    }}>
      <div className="container" style={{ 
        backgroundColor: 'var(--color-surface)',
        minHeight: '100vh',
        boxShadow: 'var(--shadow-medium)'
      }}>
        <header className="flex justify-between items-center" style={{ 
          padding: 'var(--spacing-20) 0',
          borderBottom: '2px solid var(--color-primary-gold)',
          marginBottom: 'var(--spacing-16)'
        }}>
          <div className="flex items-center gap-8" style={{ flex: 1 }}>
            <VaultIcon size={40} className="text-gold" />
            <div>
              <h1 className="text-4xl font-bold text-gold" style={{ margin: 0 }}>
                Thijoori
              </h1>
              <p className="text-secondary text-lg" style={{ margin: 'var(--spacing-2) 0 0 0' }}>
                Your assets. Your control. Always.
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={lockWallet}
            style={{
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <VaultIcon size={16} className="text-secondary" />
            Lock
          </button>
        </header>

        <nav className="nav-tabs" style={{ marginBottom: 'var(--spacing-8)' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'send', label: 'Send' },
            { id: 'history', label: 'History' },
            { id: 'contacts', label: 'Contacts' },
            { id: 'wallet', label: 'Wallet' },
            { id: 'network', label: 'Network' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
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
            <UnifiedTransfer 
              connection={connection}
              allTokens={allTokens}
              onTransactionComplete={handleTransactionComplete}
            />
          )}

          {activeTab === 'history' && wallet.isConnected && connectionState.isConnected && (
            <TransactionHistory 
              connection={connection}
              publicKey={wallet.publicKey}
              isConnected={wallet.isConnected}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsManager />
          )}

          {activeTab === 'wallet' && (
            <WalletManager />
          )}

          {activeTab === 'network' && (
            <ConnectionManager />
          )}

          {(activeTab === 'overview' || activeTab === 'send' || activeTab === 'history') && 
           (!wallet.isConnected || !connectionState.isConnected) && (
            <div className="card card-alt text-center">
              <div className="card-body">
                <VaultIcon size={32} className="text-muted mb-8" />
                <h3 className="text-xl text-secondary mb-8">
                  {!wallet.isConnected ? 'Vault Not Connected' : 'Network Not Connected'}
                </h3>
                <p className="text-secondary mb-12">
                  {!wallet.isConnected 
                    ? 'Go to the Wallet tab to manage your vault'
                    : 'Go to the Network tab to configure your connection'
                  }
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab(!wallet.isConnected ? 'wallet' : 'network')}
                >
                  Go to {!wallet.isConnected ? 'Wallet' : 'Network'} Tab
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center" style={{ 
          marginTop: 'var(--spacing-20)',
          paddingTop: 'var(--spacing-8)',
          borderTop: '1px solid var(--color-divider)'
        }}>
          <p className="text-gold text-lg" style={{ 
            fontStyle: 'italic',
            marginBottom: 'var(--spacing-8)'
          }}>
            "{currentQuote}"
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-4)'
          }}>
            <span style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              TESTNET
            </span>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Built with React, TypeScript, and @solana/web3.js
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App

import { useState, useEffect } from 'react';
import { Keypair } from '@solana/web3.js';
import { WalletState } from '../types/wallet';
import { 
  saveWalletToStorage, 
  loadWalletFromStorage, 
  clearWalletFromStorage,
  saveEncryptedWallet,
  loadEncryptedWallet,
  hasStoredWallet,
  hasLegacyWallet,
  migrateLegacyWallet
} from '../utils/storage';
import { pinManager } from '../utils/pinStorage';
import { globalCacheManager } from './useCacheManager';

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    keypair: null,
    publicKey: null,
    isConnected: false,
  });
  
  const [authState, setAuthState] = useState<{
    needsPinSetup: boolean;
    needsAuth: boolean;
    hasWallet: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    needsPinSetup: false,
    needsAuth: false,
    hasWallet: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const pinConfigured = pinManager.isPinConfigured();
    const hasWallet = hasStoredWallet();
    const pinUnlocked = pinManager.isPinUnlocked();
    
    console.log('Wallet status check:', { pinConfigured, hasWallet, pinUnlocked });
    
    if (!pinConfigured) {
      // First time user - needs to set up PIN
      setAuthState({
        needsPinSetup: true,
        needsAuth: false,
        hasWallet: false,
        isLoading: false,
        error: null
      });
    } else if (!pinUnlocked) {
      // PIN is configured but locked - needs auth
      setAuthState({
        needsPinSetup: false,
        needsAuth: true,
        hasWallet: hasWallet,
        isLoading: false,
        error: null
      });
    } else {
      // PIN is unlocked, try to load wallet
      if (hasWallet) {
        loadWalletWithCurrentPin();
      } else {
        // PIN unlocked but no wallet - ready for wallet creation
        setAuthState({
          needsPinSetup: false,
          needsAuth: false,
          hasWallet: false,
          isLoading: false,
          error: null
        });
      }
    }
  };

  const loadWalletWithCurrentPin = async () => {
    const pin = pinManager.getCurrentPin();
    if (!pin) {
      setAuthState(prev => ({ ...prev, needsAuth: true, isLoading: false }));
      return;
    }

    try {
      // Handle legacy wallet migration
      if (hasLegacyWallet()) {
        console.log('Migrating legacy wallet...');
        await migrateLegacyWallet(pin);
      }

      const keypair = await loadEncryptedWallet(pin);
      if (keypair) {
        setWallet({
          keypair,
          publicKey: keypair.publicKey.toString(),
          isConnected: true,
        });
        
        setAuthState({
          needsPinSetup: false,
          needsAuth: false,
          hasWallet: true,
          isLoading: false,
          error: null
        });

        // Invalidate all cache when wallet is loaded
        globalCacheManager.markDirty('all');
      } else {
        setAuthState({
          needsPinSetup: false,
          needsAuth: false,
          hasWallet: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load wallet' 
      }));
    }
  };

  const setupPin = async (pin: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await pinManager.setupPin(pin);
      
      setAuthState({
        needsPinSetup: false,
        needsAuth: false,
        hasWallet: false,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      console.error('Error setting up PIN:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to set up PIN' 
      }));
      return false;
    }
  };

  const unlockWallet = async (pin: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const unlocked = await pinManager.unlockWithPin(pin);
      if (!unlocked) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Incorrect PIN. Please try again.' 
        }));
        return false;
      }
      
      // PIN is now unlocked, check for wallets
      await loadWalletWithCurrentPin();
      return true;
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to unlock wallet' 
      }));
      return false;
    }
  };

  const generateWallet = async (): Promise<boolean> => {
    try {
      const pin = pinManager.getCurrentPin();
      if (!pin) {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'PIN not available. Please unlock first.' 
        }));
        return false;
      }

      const keypair = Keypair.generate();
      await saveEncryptedWallet(keypair, pin);
      
      const newWallet = {
        keypair,
        publicKey: keypair.publicKey.toString(),
        isConnected: true,
      };
      
      setWallet(newWallet);
      setAuthState(prev => ({
        ...prev,
        hasWallet: true,
        error: null
      }));

      // Invalidate all cache when new wallet is generated
      globalCacheManager.markDirty('all');
      
      return true;
    } catch (error) {
      console.error('Error generating wallet:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to create wallet. Please try again.' 
      }));
      return false;
    }
  };

  const importWallet = async (privateKeyArray: number[]): Promise<boolean> => {
    try {
      const pin = pinManager.getCurrentPin();
      if (!pin) {
        setAuthState(prev => ({ 
          ...prev, 
          error: 'PIN not available. Please unlock first.' 
        }));
        return false;
      }

      const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
      await saveEncryptedWallet(keypair, pin);
      
      const newWallet = {
        keypair,
        publicKey: keypair.publicKey.toString(),
        isConnected: true,
      };
      
      setWallet(newWallet);
      setAuthState(prev => ({
        ...prev,
        hasWallet: true,
        error: null
      }));

      // Invalidate all cache when wallet is imported
      globalCacheManager.markDirty('all');
      
      return true;
    } catch (error) {
      console.error('Error importing wallet:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to import wallet. Please check your private key.' 
      }));
      return false;
    }
  };

  const importWalletFromString = async (privateKeyString: string): Promise<boolean> => {
    try {
      const privateKeyArray = JSON.parse(privateKeyString);
      return await importWallet(privateKeyArray);
    } catch (error) {
      console.error('Error parsing private key:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Invalid private key format. Please check your input.' 
      }));
      return false;
    }
  };

  const disconnectWallet = () => {
    setWallet({
      keypair: null,
      publicKey: null,
      isConnected: false,
    });
    clearWalletFromStorage();
    setAuthState(prev => ({
      ...prev,
      hasWallet: false,
      error: null
    }));

    // Invalidate all cache when wallet is disconnected
    globalCacheManager.markDirty('all');
  };

  const exportPrivateKey = (): string | null => {
    if (!wallet.keypair) return null;
    return JSON.stringify(Array.from(wallet.keypair.secretKey));
  };

  const lockWallet = () => {
    pinManager.lock();
    setWallet({
      keypair: null,
      publicKey: null,
      isConnected: false,
    });
    setAuthState(prev => ({
      ...prev,
      needsAuth: true,
      error: null
    }));
  };

  const resetAll = () => {
    pinManager.reset();
    clearWalletFromStorage();
    setWallet({
      keypair: null,
      publicKey: null,
      isConnected: false,
    });
    setAuthState({
      needsPinSetup: true,
      needsAuth: false,
      hasWallet: false,
      isLoading: false,
      error: null
    });
  };

  return {
    wallet,
    authState,
    setupPin,
    unlockWallet,
    generateWallet,
    importWallet,
    importWalletFromString,
    disconnectWallet,
    exportPrivateKey,
    lockWallet,
    resetAll,
    checkWalletStatus,
  };
};
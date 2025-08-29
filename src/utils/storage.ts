import { Keypair } from "@solana/web3.js";
import { WalletEncryption, STORAGE_KEYS } from "./encryption";

const WALLET_STORAGE_KEY = "solana_wallet_keypair"; // Legacy key for compatibility
const CONNECTION_STORAGE_KEY = "solana_connection_endpoint";

// Legacy functions for backward compatibility
export const saveWalletToStorage = (keypair: Keypair): void => {
  const secretKey = Array.from(keypair.secretKey);
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(secretKey));
};

export const loadWalletFromStorage = (): Keypair | null => {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!stored) return null;

    const secretKey = JSON.parse(stored);
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (error) {
    console.error("Error loading wallet from storage:", error);
    return null;
  }
};

export const clearWalletFromStorage = (): void => {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_WALLET);
  localStorage.removeItem(STORAGE_KEYS.HAS_WALLET);
};

// New encrypted storage functions
export const saveEncryptedWallet = async (
  keypair: Keypair,
  pin: string,
): Promise<void> => {
  try {
    const encryptedData = await WalletEncryption.encryptWallet(keypair, pin);
    localStorage.setItem(STORAGE_KEYS.ENCRYPTED_WALLET, encryptedData);
    localStorage.setItem(STORAGE_KEYS.HAS_WALLET, "true");

    // Remove legacy unencrypted wallet if it exists
    localStorage.removeItem(WALLET_STORAGE_KEY);
  } catch (error) {
    console.error("Error saving encrypted wallet:", error);
    throw error;
  }
};

export const loadEncryptedWallet = async (
  pin: string,
): Promise<Keypair | null> => {
  try {
    const encryptedData = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_WALLET);
    if (!encryptedData) return null;

    return await WalletEncryption.decryptWallet(encryptedData, pin);
  } catch (error) {
    console.error("Error loading encrypted wallet:", error);
    throw error;
  }
};

export const hasStoredWallet = (): boolean => {
  return (
    localStorage.getItem(STORAGE_KEYS.HAS_WALLET) === "true" ||
    localStorage.getItem(WALLET_STORAGE_KEY) !== null
  );
};

export const hasLegacyWallet = (): boolean => {
  return localStorage.getItem(WALLET_STORAGE_KEY) !== null;
};

export const migrateLegacyWallet = async (pin: string): Promise<boolean> => {
  try {
    console.log("Migrating legacy wallet with PIN:", pin);
    const legacyWallet = loadWalletFromStorage();
    if (!legacyWallet) {
      console.log("No legacy wallet found");
      return false;
    }

    await saveEncryptedWallet(legacyWallet, pin);
    localStorage.removeItem(WALLET_STORAGE_KEY);
    console.log("Legacy wallet migrated successfully");
    return true;
  } catch (error) {
    console.error("Error migrating legacy wallet:", error);
    return false;
  }
};

export const saveConnectionEndpoint = (endpoint: string): void => {
  localStorage.setItem(CONNECTION_STORAGE_KEY, endpoint);
};

export const loadConnectionEndpoint = (): string => {
  return (
    localStorage.getItem(CONNECTION_STORAGE_KEY) ||
    "https://alina.python-census.ts.net"
  );
};

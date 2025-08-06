import { Keypair } from '@solana/web3.js';

// Simple encryption using Web Crypto API with PBKDF2 and AES-GCM
export class WalletEncryption {
  private static async deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptWallet(keypair: Keypair, pin: string): Promise<string> {
    try {
      // Generate a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive key from PIN and salt
      const key = await this.deriveKey(pin, salt);
      
      // Convert keypair to bytes
      const secretKeyBytes = keypair.secretKey;
      
      // Encrypt the secret key
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        secretKeyBytes
      );
      
      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt wallet');
    }
  }

  static async decryptWallet(encryptedData: string, pin: string): Promise<Keypair> {
    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encryptedBytes = combined.slice(28);
      
      // Derive key from PIN and salt
      const key = await this.deriveKey(pin, salt);
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedBytes
      );
      
      // Convert back to Keypair
      const secretKey = new Uint8Array(decryptedData);
      return Keypair.fromSecretKey(secretKey);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt wallet - incorrect PIN?');
    }
  }

  static async validatePin(encryptedData: string, pin: string): Promise<boolean> {
    try {
      await this.decryptWallet(encryptedData, pin);
      return true;
    } catch {
      return false;
    }
  }
}

// Storage keys
export const STORAGE_KEYS = {
  ENCRYPTED_WALLET: 'encrypted_wallet',
  HAS_WALLET: 'has_wallet'
} as const;
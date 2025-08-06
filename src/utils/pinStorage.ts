// PIN Management Utility
// This manages the user's PIN in a session-based way

class PinManager {
  private static instance: PinManager;
  private currentPin: string | null = null;
  private pinHash: string | null = null;

  static getInstance(): PinManager {
    if (!PinManager.instance) {
      PinManager.instance = new PinManager();
    }
    return PinManager.instance;
  }

  // Hash a PIN for storage verification (not for encryption)
  private async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'solana_wallet_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Set up a new PIN for the first time
  async setupPin(pin: string): Promise<void> {
    this.currentPin = pin;
    this.pinHash = await this.hashPin(pin);
    
    // Store the hash in localStorage for verification
    localStorage.setItem('pin_hash', this.pinHash);
    localStorage.setItem('pin_configured', 'true');
  }

  // Verify and unlock with existing PIN
  async unlockWithPin(pin: string): Promise<boolean> {
    const storedHash = localStorage.getItem('pin_hash');
    if (!storedHash) return false;

    const inputHash = await this.hashPin(pin);
    if (inputHash === storedHash) {
      this.currentPin = pin;
      this.pinHash = inputHash;
      return true;
    }
    return false;
  }

  // Get the current PIN (only available after setup or unlock)
  getCurrentPin(): string | null {
    return this.currentPin;
  }

  // Check if PIN is configured
  isPinConfigured(): boolean {
    return localStorage.getItem('pin_configured') === 'true';
  }

  // Check if PIN is currently unlocked
  isPinUnlocked(): boolean {
    return this.currentPin !== null;
  }

  // Lock the PIN (clear from memory)
  lock(): void {
    this.currentPin = null;
  }

  // Change PIN
  async changePin(oldPin: string, newPin: string): Promise<boolean> {
    if (!await this.unlockWithPin(oldPin)) {
      return false;
    }
    
    await this.setupPin(newPin);
    return true;
  }

  // Reset everything (for troubleshooting)
  reset(): void {
    this.currentPin = null;
    this.pinHash = null;
    localStorage.removeItem('pin_hash');
    localStorage.removeItem('pin_configured');
  }
}

export const pinManager = PinManager.getInstance();
export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  description?: string;
  website?: string;
  socials?: {
    twitter?: string;
  };
}

export interface TokenRegistry {
  name: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  keywords: string[];
  logoURI: string;
  tokens: TokenMetadata[];
}

let tokenRegistry: TokenRegistry | null = null;
let tokenMetadataCache: Map<string, TokenMetadata> = new Map();

export const loadTokenRegistry = async (): Promise<TokenRegistry> => {
  if (tokenRegistry) {
    return tokenRegistry;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}spl_token/token-registry.json`);
    if (!response.ok) {
      throw new Error('Failed to load token registry');
    }
    
    tokenRegistry = await response.json();
    
    // Populate cache
    tokenRegistry.tokens.forEach(token => {
      tokenMetadataCache.set(token.address, token);
    });
    
    return tokenRegistry;
  } catch (error) {
    console.error('Error loading token registry:', error);
    // Return empty registry if loading fails
    return {
      name: 'Empty Registry',
      version: { major: 1, minor: 0, patch: 0 },
      keywords: [],
      logoURI: '',
      tokens: []
    };
  }
};

export const getTokenMetadata = async (mintAddress: string): Promise<TokenMetadata | null> => {
  // Check cache first
  if (tokenMetadataCache.has(mintAddress)) {
    return tokenMetadataCache.get(mintAddress) || null;
  }

  // Load registry if not already loaded
  await loadTokenRegistry();

  // Try to load individual metadata file
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}spl_token/token-metadata/${mintAddress}.json`);
    if (response.ok) {
      const metadata = await response.json();
      
      // Convert metadata format to our TokenMetadata interface
      const tokenMetadata: TokenMetadata = {
        address: mintAddress,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.attributes?.find((attr: any) => attr.trait_type === 'Decimals')?.value || 9,
        logoURI: metadata.image,
        description: metadata.description,
        website: metadata.external_url
      };
      
      // Cache it
      tokenMetadataCache.set(mintAddress, tokenMetadata);
      return tokenMetadata;
    }
  } catch (error) {
    console.warn(`No individual metadata file found for token ${mintAddress}`);
  }

  return tokenMetadataCache.get(mintAddress) || null;
};

export const getTokenName = async (mintAddress: string): Promise<string> => {
  const metadata = await getTokenMetadata(mintAddress);
  return metadata?.name || `Token ${mintAddress.slice(0, 8)}...`;
};

export const getTokenSymbol = async (mintAddress: string): Promise<string> => {
  const metadata = await getTokenMetadata(mintAddress);
  return metadata?.symbol || 'UNKNOWN';
};

export const getTokenIcon = async (mintAddress: string): Promise<string | null> => {
  const metadata = await getTokenMetadata(mintAddress);
  return metadata?.logoURI || null;
};
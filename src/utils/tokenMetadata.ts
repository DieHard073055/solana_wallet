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
  console.log(`getTokenMetadata called for: ${mintAddress}`); // Debug log
  
  // For SOL or if not in cache, try individual metadata file first
  if (!tokenMetadataCache.has(mintAddress) || mintAddress === '11111111111111111111111111111112') {
    // Try to load individual metadata file
    const metadataUrl = `${import.meta.env.BASE_URL}spl_token/token-metadata/${mintAddress}.json`;
    console.log(`Fetching metadata from: ${metadataUrl}`); // Debug log
    
    try {
      const response = await fetch(metadataUrl);
      console.log(`Fetch response for ${mintAddress}:`, response.status, response.ok); // Debug log
      
      if (response.ok) {
        const metadata = await response.json();
        console.log(`Raw metadata for ${mintAddress}:`, metadata); // Debug log
        
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
        
        console.log(`Processed metadata for ${mintAddress}:`, tokenMetadata); // Debug log
        
        // Cache it (override any existing cache)
        tokenMetadataCache.set(mintAddress, tokenMetadata);
        return tokenMetadata;
      } else {
        console.log(`Failed to fetch metadata for ${mintAddress}: ${response.status}`); // Debug log
      }
    } catch (error) {
      console.warn(`Error fetching metadata for token ${mintAddress}:`, error);
    }
  }
  
  // Check cache 
  if (tokenMetadataCache.has(mintAddress)) {
    const cached = tokenMetadataCache.get(mintAddress) || null;
    console.log(`Using cached metadata for ${mintAddress}:`, cached); // Debug log
    return cached;
  }

  // Load registry if not already loaded and try from there
  await loadTokenRegistry();

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
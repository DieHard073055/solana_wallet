#!/bin/bash

# SPL Token Creator with Metadata Registry
# Creates SPL tokens and maintains a JSON registry for your wallet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_FILE="./token-registry.json"
METADATA_DIR="./token-metadata"

echo -e "${BLUE}🪙 SPL Token Creator & Registry Manager${NC}"
echo "========================================"

# Create directories if they don't exist
mkdir -p "$METADATA_DIR"

# Initialize registry file if it doesn't exist
if [ ! -f "$REGISTRY_FILE" ]; then
    echo -e "${YELLOW}📝 Creating new token registry...${NC}"
    cat > "$REGISTRY_FILE" << 'EOF'
{
  "name": "Local Development Token Registry",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "keywords": ["solana", "spl", "token", "local", "development"],
  "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  "tokens": []
}
EOF
    echo -e "${GREEN}✓ Registry file created: $REGISTRY_FILE${NC}"
fi

# Function to validate URL
validate_url() {
    local url="$1"
    if [[ $url =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local required="$3"
    local default="$4"
    
    while true; do
        if [ -n "$default" ]; then
            read -p "$prompt [$default]: " input
            if [ -z "$input" ]; then
                input="$default"
            fi
        else
            read -p "$prompt: " input
        fi
        
        if [ "$required" = "true" ] && [ -z "$input" ]; then
            echo -e "${RED}This field is required!${NC}"
            continue
        fi
        
        eval "$var_name='$input'"
        break
    done
}

# Function to prompt for URL
prompt_url() {
    local prompt="$1"
    local var_name="$2"
    local required="$3"
    
    while true; do
        read -p "$prompt: " input
        
        if [ "$required" = "true" ] && [ -z "$input" ]; then
            echo -e "${RED}This field is required!${NC}"
            continue
        fi
        
        if [ -n "$input" ] && ! validate_url "$input"; then
            echo -e "${RED}Please enter a valid URL (http:// or https://)${NC}"
            continue
        fi
        
        eval "$var_name='$input'"
        break
    done
}

echo
echo -e "${PURPLE}📋 Token Information${NC}"
echo "===================="

# Collect token information
prompt_input "Token Name (e.g., 'My Awesome Token')" TOKEN_NAME true
prompt_input "Token Symbol (e.g., 'MAT')" TOKEN_SYMBOL true
prompt_input "Token Decimals" TOKEN_DECIMALS true "9"
prompt_input "Token Description" TOKEN_DESCRIPTION false

echo
echo -e "${PURPLE}🔗 URLs & Links${NC}"
echo "==============="

prompt_url "Icon/Logo URL" ICON_URL false
prompt_url "Website URL" WEBSITE_URL false
prompt_url "Twitter URL" TWITTER_URL false
prompt_url "Discord URL" DISCORD_URL false
prompt_url "Telegram URL" TELEGRAM_URL false

echo
echo -e "${YELLOW}🔨 Creating SPL Token...${NC}"

# Check if spl-token is installed
if ! command -v spl-token &> /dev/null; then
    echo -e "${RED}❌ spl-token CLI not found!${NC}"
    echo "Install it with: cargo install spl-token-cli"
    exit 1
fi

# Create the token
echo "Creating token with $TOKEN_DECIMALS decimals..."
TOKEN_ADDRESS=$(spl-token create-token --decimals "$TOKEN_DECIMALS" | grep "Creating token" | awk '{print $3}')

if [ -z "$TOKEN_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to create token!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token created: $TOKEN_ADDRESS${NC}"

# Create token account
echo "Creating token account..."
TOKEN_ACCOUNT=$(spl-token create-account "$TOKEN_ADDRESS" | grep "Creating account" | awk '{print $3}')
echo -e "${GREEN}✓ Token account created: $TOKEN_ACCOUNT${NC}"

# Mint initial supply
echo
prompt_input "Initial token supply to mint" INITIAL_SUPPLY true "1000000"
echo "Minting $INITIAL_SUPPLY tokens..."
spl-token mint "$TOKEN_ADDRESS" "$INITIAL_SUPPLY"
echo -e "${GREEN}✓ Minted $INITIAL_SUPPLY tokens${NC}"

# Create metadata JSON file
METADATA_FILE="$METADATA_DIR/${TOKEN_ADDRESS}.json"
echo
echo -e "${YELLOW}📄 Creating metadata file...${NC}"

# Build socials object
SOCIALS_JSON="{}"
if [ -n "$TWITTER_URL" ]; then
    SOCIALS_JSON=$(echo "$SOCIALS_JSON" | jq --arg url "$TWITTER_URL" '. + {twitter: $url}')
fi
if [ -n "$DISCORD_URL" ]; then
    SOCIALS_JSON=$(echo "$SOCIALS_JSON" | jq --arg url "$DISCORD_URL" '. + {discord: $url}')
fi
if [ -n "$TELEGRAM_URL" ]; then
    SOCIALS_JSON=$(echo "$SOCIALS_JSON" | jq --arg url "$TELEGRAM_URL" '. + {telegram: $url}')
fi

# Create metadata JSON
cat > "$METADATA_FILE" << EOF
{
  "name": "$TOKEN_NAME",
  "symbol": "$TOKEN_SYMBOL",
  "description": "$TOKEN_DESCRIPTION",
  "image": "$ICON_URL",
  "external_url": "$WEBSITE_URL",
  "attributes": [
    {
      "trait_type": "Decimals",
      "value": $TOKEN_DECIMALS
    },
    {
      "trait_type": "Supply",
      "value": "$INITIAL_SUPPLY"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "$ICON_URL",
        "type": "image/png"
      }
    ],
    "category": "fungible"
  }
}
EOF

echo -e "${GREEN}✓ Metadata file created: $METADATA_FILE${NC}"

# Add to token registry
echo -e "${YELLOW}📚 Adding to token registry...${NC}"

# Create new token entry
NEW_TOKEN=$(jq -n \
  --arg address "$TOKEN_ADDRESS" \
  --arg name "$TOKEN_NAME" \
  --arg symbol "$TOKEN_SYMBOL" \
  --argjson decimals "$TOKEN_DECIMALS" \
  --arg logoURI "$ICON_URL" \
  --arg website "$WEBSITE_URL" \
  --argjson socials "$SOCIALS_JSON" \
  --arg description "$TOKEN_DESCRIPTION" \
  '{
    address: $address,
    name: $name,
    symbol: $symbol,
    decimals: $decimals,
    logoURI: $logoURI,
    website: $website,
    socials: $socials,
    description: $description,
    tags: ["local", "development"]
  }' | jq 'with_entries(select(.value != null and .value != ""))')

# Add to registry
jq --argjson token "$NEW_TOKEN" '.tokens += [$token]' "$REGISTRY_FILE" > tmp.json && mv tmp.json "$REGISTRY_FILE"

echo -e "${GREEN}✓ Added to registry: $REGISTRY_FILE${NC}"

# Display summary
echo
echo -e "${BLUE}🎉 Token Creation Summary${NC}"
echo "========================="
echo -e "Token Address:    ${GREEN}$TOKEN_ADDRESS${NC}"
echo -e "Token Account:    ${GREEN}$TOKEN_ACCOUNT${NC}"
echo -e "Name:             $TOKEN_NAME"
echo -e "Symbol:           $TOKEN_SYMBOL"
echo -e "Decimals:         $TOKEN_DECIMALS"
echo -e "Initial Supply:   $INITIAL_SUPPLY"
echo -e "Metadata File:    $METADATA_FILE"
echo -e "Registry File:    $REGISTRY_FILE"

# Check balance
echo
echo -e "${YELLOW}💰 Current Balance:${NC}"
spl-token balance "$TOKEN_ADDRESS"

echo
echo -e "${PURPLE}📝 Next Steps:${NC}"
echo "1. Commit $REGISTRY_FILE and $METADATA_DIR/ to your git repository"
echo "2. Host $REGISTRY_FILE publicly (GitHub Pages, etc.)"
echo "3. Configure your wallet to use your registry URL"
echo "4. Test your token in your wallet!"

echo
echo -e "${GREEN}✅ Token creation completed successfully!${NC}"

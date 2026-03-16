// Powered by OnSpace.AI
// RPC URLs are built from EXPO_PUBLIC_INFURA_KEY — set this in your .env file.
const INFURA_KEY = process.env.EXPO_PUBLIC_INFURA_KEY ?? '';

export const NETWORKS = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    explorerUrl: 'https://etherscan.io',
    decimals: 18,
    color: '#627EEA',
    coinGeckoId: 'ethereum',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpcUrl: `https://bsc-mainnet.infura.io/v3/${INFURA_KEY}`,
    explorerUrl: 'https://bscscan.com',
    decimals: 18,
    color: '#F3BA2F',
    coinGeckoId: 'binancecoin',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
    explorerUrl: 'https://polygonscan.com',
    decimals: 18,
    color: '#8247E5',
    coinGeckoId: 'matic-network',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    chainId: 0,
    rpcUrl: `https://solana-mainnet.infura.io/v3/${INFURA_KEY}`,
    explorerUrl: 'https://solscan.io',
    decimals: 9,
    color: '#9945FF',
    coinGeckoId: 'solana',
  },
} as const;

export type NetworkId = keyof typeof NETWORKS;

export const DERIVATION_PATHS: Record<string, string> = {
  ethereum: "m/44'/60'/0'/0/0",
  bsc: "m/44'/60'/0'/0/0",
  polygon: "m/44'/60'/0'/0/0",
  solana: "m/44'/501'/0'/0'",
};

export const STORAGE_KEYS = {
  ENCRYPTED_WALLET: 'nw_encrypted_wallet',
  WALLET_ADDRESS: 'nw_wallet_addresses',
  SELECTED_NETWORK: 'nw_selected_network',
  HAS_WALLET: 'nw_has_wallet',
};

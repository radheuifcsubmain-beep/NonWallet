// OnSpace Wallet — Pinata IPFS service for custom token metadata
import AsyncStorage from '@react-native-async-storage/async-storage';

const PINATA_API_KEY_STORAGE = 'onspace_pinata_api_key';
const PINATA_SECRET_STORAGE = 'onspace_pinata_secret';

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  contractAddress: string;
  network: string;
  chainId?: number;
  description?: string;
  color?: string;
  logoUrl?: string;
  creatorWallet?: string;
  website?: string;
  createdAt?: string;
}

export async function savePinataCredentials(apiKey: string, secretKey: string): Promise<void> {
  await AsyncStorage.setItem(PINATA_API_KEY_STORAGE, apiKey);
  await AsyncStorage.setItem(PINATA_SECRET_STORAGE, secretKey);
}

export async function getPinataCredentials(): Promise<{ apiKey: string; secretKey: string } | null> {
  const apiKey = await AsyncStorage.getItem(PINATA_API_KEY_STORAGE);
  const secretKey = await AsyncStorage.getItem(PINATA_SECRET_STORAGE);
  if (!apiKey || !secretKey) return null;
  return { apiKey, secretKey };
}

export async function hasPinataCredentials(): Promise<boolean> {
  const creds = await getPinataCredentials();
  return creds !== null;
}

// Fetch token metadata from Pinata IPFS by CID or full URL
export async function fetchTokenMetadataFromPinata(cidOrUrl: string): Promise<TokenMetadata> {
  // Normalise input — accept CID, ipfs:// URL, or https gateway URL
  let url: string;
  if (cidOrUrl.startsWith('http')) {
    url = cidOrUrl;
  } else if (cidOrUrl.startsWith('ipfs://')) {
    const cid = cidOrUrl.replace('ipfs://', '');
    url = `https://gateway.pinata.cloud/ipfs/${cid}`;
  } else {
    // Treat as raw CID
    url = `https://gateway.pinata.cloud/ipfs/${cidOrUrl}`;
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Validate required fields
  if (!data.symbol || !data.name || !data.contractAddress) {
    throw new Error('Invalid token metadata: missing required fields (name, symbol, contractAddress)');
  }

  return {
    name: String(data.name),
    symbol: String(data.symbol).toUpperCase(),
    decimals: Number(data.decimals ?? 18),
    totalSupply: data.totalSupply ? String(data.totalSupply) : undefined,
    contractAddress: String(data.contractAddress),
    network: String(data.network ?? data.chain ?? 'ethereum').toLowerCase(),
    chainId: data.chainId ? Number(data.chainId) : undefined,
    description: data.description ? String(data.description) : undefined,
    color: data.color ?? '#00D4FF',
    logoUrl: data.logoUrl ?? data.image ?? undefined,
    creatorWallet: data.creatorWallet ?? data.owner ?? undefined,
    website: data.website ?? undefined,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

// Fetch token metadata using Pinata API (authenticated) by name/keyword search
export async function searchPinataTokens(keyword: string): Promise<TokenMetadata[]> {
  const creds = await getPinataCredentials();
  if (!creds) throw new Error('Pinata credentials not configured');

  const response = await fetch(
    `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${encodeURIComponent(keyword)}&pageLimit=10`,
    {
      headers: {
        pinata_api_key: creds.apiKey,
        pinata_secret_api_key: creds.secretKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pinata API error: ${response.status}`);
  }

  const result = await response.json();
  const rows: any[] = result.rows ?? [];

  const metadataResults: TokenMetadata[] = [];
  for (const row of rows) {
    try {
      const cid = row.ipfs_pin_hash;
      const meta = await fetchTokenMetadataFromPinata(cid);
      metadataResults.push(meta);
    } catch {
      // Skip invalid entries
    }
  }
  return metadataResults;
}

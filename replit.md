# OnSpace Wallet

## Overview

OnSpace Wallet is a non-custodial multi-chain cryptocurrency wallet built with React Native / Expo. It supports Ethereum, BSC, Polygon, and Solana networks, with PIN authentication, Pinata IPFS custom token import, and a built-in dApp browser.

## Tech Stack

- **Framework**: Expo ~53.0.x with Expo Router ~5.0.x
- **Language**: TypeScript
- **Runtime**: React Native 0.79.x + React 19.0.0
- **Web support**: React Native Web ~0.20.0
- **State**: React Context (WalletContext)
- **Package Manager**: pnpm

## Project Structure

```
app/                  # Expo Router file-based routes
  _layout.tsx         # Root layout with WalletProvider
  index.tsx           # Landing/home screen
  create.tsx          # Create wallet screen (with PIN setup step)
  import.tsx          # Import wallet screen (with PIN setup step)
  (tabs)/             # Tab navigation group
    _layout.tsx       # Tab bar layout (6 tabs)
    index.tsx         # Portfolio tab
    history.tsx       # Transaction history tab
    receive.tsx       # Receive crypto tab
    send.tsx          # Send crypto tab
    discover.tsx      # Built-in dApp browser (Google as default)
    settings.tsx      # Settings (PIN gate for mnemonics, Pinata config, custom tokens)
components/           # Shared UI components
  feature/            # Feature-specific components
    LockScreen.tsx    # PIN/biometric lock screen
    TokenList.tsx     # Standard + custom (IPFS) token list with badges
  ui/                 # Generic UI components
constants/            # App constants (config.ts, theme.ts)
contexts/
  WalletContext.tsx   # All wallet state + custom token management
hooks/
  useWallet.ts        # Context hook
services/
  biometricService.ts    # PIN storage + biometric auth
  blockchainService.ts   # Multi-chain balance fetching
  cryptoService.ts       # Mnemonic gen/derive/encrypt/store
  tokenService.ts        # ERC-20 balance + CoinGecko prices
  pinataService.ts       # Pinata IPFS token metadata fetch
  customTokenService.ts  # Custom token storage (AsyncStorage)
assets/               # Static assets
```

## Running the App

```bash
PORT=5000 pnpm expo start --web --port 5000
```

The workflow "Start application" handles this automatically.

## Key Features

### PIN Authentication
- PIN is set during wallet creation (create.tsx) or import (import.tsx)
- Wallet always locks on app start if a PIN is saved
- PIN is required to unlock the app (via LockScreen.tsx)
- PIN gate before viewing the seed phrase in Settings

### Discover Browser
- Built-in browser with Google as default search engine
- Quick links to DeFi sites (CoinGecko, Etherscan, Uniswap, etc.)
- Address bar with URL/search normalization
- iframe (web) / WebView (native) rendering

### Pinata IPFS Token Import
- Configure Pinata API credentials in Settings
- Import custom tokens by pasting a CID or gateway URL
- Token metadata format: { name, symbol, decimals, contractAddress, network, color, creatorWallet, ... }
- Tokens with matching `creatorWallet` address get a "My Token" badge
- All custom tokens persist in AsyncStorage

### Custom Token Visibility
- Custom tokens shown in TokenList with "Custom" badge
- "My Token" badge when creatorWallet matches wallet address
- On-chain balance fetched via eth_call (EVM only)

## Workflow

- **Start application**: `PORT=5000 pnpm expo start --web --port 5000` (webview, port 5000)

## Crypto Service Architecture

`services/cryptoService.ts` uses browser-safe, production-ready libraries:

| Concern | Library |
|---|---|
| Mnemonic generation | `@scure/bip39` + `expo-crypto` |
| EVM derivation | `ethers` HDNodeWallet |
| EVM transactions | `ethers` JsonRpcProvider |
| Solana HD derivation | SubtleCrypto HMAC-SHA512 (SLIP-0010) |
| Solana keypair | `tweetnacl` ed25519 |
| Mnemonic encryption | `react-native-crypto-js` AES-256 |
| Secure storage | `expo-secure-store` (native) / localStorage (web) |

## Environment Variables

- `EXPO_PUBLIC_INFURA_KEY` — Infura project ID for RPC URLs (Ethereum, BSC, Polygon, Solana)

# OnSpace App

## Overview

OnSpace AI is a React Native / Expo mobile app that demonstrates cross-platform capabilities across iOS, Android, and Web. It appears to be a crypto wallet application built with Expo Router.

## Tech Stack

- **Framework**: Expo ~53.0.x with Expo Router ~5.0.x
- **Language**: TypeScript
- **Runtime**: React Native 0.79.x + React 19.0.0
- **Web support**: React Native Web ~0.20.0
- **State**: React Context (WalletContext)
- **Backend**: Supabase (@supabase/supabase-js)
- **Package Manager**: npm (with pnpm-lock.yaml present)

## Project Structure

```
app/                  # Expo Router file-based routes
  _layout.tsx         # Root layout with WalletProvider
  index.tsx           # Landing/home screen
  create.tsx          # Create wallet screen
  import.tsx          # Import wallet screen
  (tabs)/             # Tab navigation group
    _layout.tsx       # Tab bar layout
    index.tsx         # Main tab
    history.tsx       # Transaction history
    receive.tsx       # Receive crypto
    send.tsx          # Send crypto
    settings.tsx      # Settings
components/           # Shared UI components
  feature/            # Feature-specific components
  ui/                 # Generic UI components
constants/            # App constants
  Colors.ts
  config.ts
  theme.ts
contexts/             # React Context providers
  WalletContext.tsx   # Wallet state management
hooks/                # Custom React hooks
services/             # Business logic services
  biometricService.ts
  blockchainService.ts
  cryptoService.ts
  tokenService.ts
assets/               # Static assets (images, fonts)
```

## Running the App

The app runs via Expo development server:

```bash
npx expo start --web --port 5000
```

The workflow "Start application" handles this automatically.

## Workflow

- **Start application**: Runs `PORT=5000 npx expo start --web --port 5000` on port 5000 (webview)

## Deployment

Configured as a static site:
- Build: `npx expo export --platform web`
- Public dir: `dist`

## Crypto Service Architecture

`services/cryptoService.ts` uses only browser-safe, production-ready libraries:

| Concern | Library | Why |
|---|---|---|
| Mnemonic generation | `@scure/bip39` + `expo-crypto` | @noble/hashes based — no Node.js streams |
| Mnemonic validation | `@scure/bip39` | BIP39 checksum verified |
| EVM derivation | `ethers` HDNodeWallet | Standard HD wallet from phrase |
| EVM transactions | `ethers` JsonRpcProvider | EIP-1559 + legacy gas support |
| Solana HD derivation | SubtleCrypto HMAC-SHA512 (SLIP-0010) | Available on all Hermes RN 0.71+ & web |
| Solana keypair | `tweetnacl` ed25519 | Pure JS, no native deps |
| Solana address | `bs58` encode | Standard base58 |
| Mnemonic encryption | `react-native-crypto-js` AES-256 | Encrypts before SecureStore |
| Secure storage | `expo-secure-store` (iOS/Android Keychain) | Hardware-backed where available |

## Dependencies Notes

- Uses `--legacy-peer-deps` for installation due to peer dependency conflicts with `react-native-dynamic` (expects React 16.x but project uses React 19)
- Various Expo packages are slightly behind recommended versions (non-breaking)
- `bip39` and `ed25519-hd-key` were removed — they pull in `readable-stream` which crashes in Expo web

# Asset Registry

A decentralized Real-World Asset (RWA) tokenization platform built on Ethereum.

Asset Registry enables users to register, manage, and transfer ownership of real-world assets on-chain with full transparency and verifiable history.

---

## Live Demo

 https://asset-tokenization-platform-nextjs.vercel.app

---

## Problem

Ownership of real-world assets is often:

- fragmented across systems  
- difficult to verify  
- non-transparent  
- inefficient to transfer  

There is no unified, trustless system for managing asset ownership globally.

---

## Solution

Asset Registry introduces a decentralized system where:

- Assets are tokenized as NFTs (ERC-721)
- Ownership is recorded on-chain
- Transfers are transparent and verifiable
- Full ownership history is preserved via events

---

## Why This Matters

Tokenization of real-world assets is a growing sector in Web3, enabling more efficient markets, fractional ownership, and global accessibility to traditionally illiquid assets.

---

## Architecture

The system follows a client–contract architecture where the frontend interacts directly with smart contracts via wagmi/viem, ensuring decentralized state management.

### Smart Contracts (`packages/hardhat`)

- **AssetRegistry.sol**
  - ERC-721 based asset registry
  - Stores:
    - asset name
    - asset type
    - valuation
  - Enables:
    - asset registration (minting)
    - ownership transfer
    - ownership queries

---

### Frontend (`packages/nextjs`)

- Built with Next.js + TypeScript
- Uses wagmi + viem for blockchain interaction

#### Key pages:

- `/` → Dashboard (wallet + asset overview)
- `/my-assets` → Register and view owned assets
- `/transfers` → Ownership transfer history

---

## Features

- Register real-world assets on-chain  
- Track ownership per wallet  
- Transfer assets securely  
- View ownership history (event-driven)  
- Wallet integration (MetaMask + WalletConnect)  
- Live testnet deployment (Sepolia)  

---

## Ownership Model

Each asset:

- is minted as an ERC-721 token  
- is uniquely identifiable  
- maintains a full transfer history  

Example:

```

Minted → 0xABC...
Transferred → 0xDEF...
Transferred → 0x123...

````

---

## Tech Stack

- **Blockchain**: Ethereum (Sepolia)
- **Smart Contracts**: Solidity + Hardhat
- **Frontend**: Next.js (App Router), TypeScript
- **Web3**: wagmi, viem
- **Wallets**: MetaMask, WalletConnect
- **Deployment**: Vercel

---

## Local Development

### 1. Install dependencies

```bash
yarn install
````

---

### 2. Start local blockchain

```bash
yarn chain
```

---

### 3. Deploy contracts

```bash
yarn deploy
```

---

### 4. Start frontend

```bash
yarn start
```

---

### 5. Open app

```
http://localhost:3000
```

---

## Environment Variables

Create:

```
packages/nextjs/.env.local
```

Add:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id
```

---

## Future Improvements

* Asset verification layer (oracle-based)
* Role-based permissions (issuers / regulators)
* Fractional ownership
* Off-chain metadata + IPFS integration
* Multi-chain support

---

## Key Learnings

* Designing event-driven ownership systems
* Integrating smart contracts with modern frontend stacks
* Handling wallet UX and transaction states
* Building production-like Web3 applications

---

## License

MIT

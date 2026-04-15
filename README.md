# Asset Registry

Asset Registry is a Web3 application for minting, tracking, and transferring real-world assets on-chain.

## Overview

This repository includes:

- `packages/hardhat`: smart contract sources, deployment scripts, and tests.
- `packages/nextjs`: Next.js frontend for registering assets and viewing ownership.

## Key components

- `packages/hardhat/contracts/AssetRegistry.sol` - ERC-721 asset registry contract.
- `packages/hardhat/deploy/01_deploy_asset_registry.ts` - deployment script.
- `packages/nextjs/app/page.tsx` - dashboard with current wallet and asset total.
- `packages/nextjs/app/myNFTs/page.tsx` - asset registration and holdings.
- `packages/nextjs/app/transfers/page.tsx` - transfer history dashboard.

## Local development

1. Install dependencies:

```sh
yarn install
```

2. Start the local Hardhat network:

```sh
yarn chain
```

3. Deploy the contract locally:

```sh
yarn deploy
```

4. Start the frontend:

```sh
yarn start
```

5. Open the app:

```sh
http://localhost:3000
```

## Notes

Legacy tutorial materials have been replaced with a clean asset registry implementation.

---

## License

MIT License.





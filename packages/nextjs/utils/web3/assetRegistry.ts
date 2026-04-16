import type { Abi } from "abitype";
import AssetRegistryArtifact from "../../../hardhat/deployments/sepolia/AssetRegistry.json";

export const ASSET_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS as `0x${string}`) ||
  ("0xd887a81be53931F3ab984f1f336aFac3849Ec703" as `0x${string}`);

export const assetRegistryContractConfig = {
  address: ASSET_REGISTRY_ADDRESS,
  abi: AssetRegistryArtifact.abi as Abi,
} as const;

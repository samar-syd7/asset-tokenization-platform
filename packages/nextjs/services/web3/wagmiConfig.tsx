import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { sepolia } from "viem/chains";

const { chains, publicClient } = configureChains([sepolia], [publicProvider()]);

export const wagmiConfig = getDefaultConfig({
  appName: "Asset Registry",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
  chains,
  publicClient,
  ssr: true,
});

export const config = wagmiConfig;

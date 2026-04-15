import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  baseAccount,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import appConfig, { type AppConfig } from "~~/app.config";

const { burnerWalletMode, targetNetworks } = appConfig as AppConfig;

const hasOnlyLocalTargetNetworks = targetNetworks.every(network => network.id === (chains.hardhat as chains.Chain).id);
const showBurnerWallet =
  burnerWalletMode !== "disabled" && (burnerWalletMode === "allNetworks" || hasOnlyLocalTargetNetworks);

const wallets = [
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  baseAccount,
  rainbowWallet,
  safeWallet,
  ...(showBurnerWallet ? [rainbowkitBurnerWallet] : []),
];

/**
 * wagmi connectors for the wagmi context
 */
export const wagmiConnectors = () => {
  // Only create connectors on client-side to avoid SSR issues
  // TODO: update when https://github.com/rainbow-me/rainbowkit/issues/2476 is resolved
  if (typeof window === "undefined") {
    return [];
  }

  return connectorsForWallets(
    [
      {
        groupName: "Supported Wallets",
        wallets,
      },
    ],

    {
      appName: "Asset Registry",
      projectId: appConfig.walletConnectProjectId,
    },
  );
};

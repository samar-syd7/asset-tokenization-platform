import appConfig from "~~/app.config";
import { useGlobalState } from "~~/services/store/store";
import { AllowedChainIds, ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/web3/networks";

/**
 * Given a chainId, retrives the network object from `app.config`,
 * if not found default to network set by `useTargetNetwork` hook
 */
export function useSelectedNetwork(chainId?: AllowedChainIds): ChainWithAttributes {
  const globalTargetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);
  const targetNetwork = appConfig.targetNetworks.find(targetNetwork => targetNetwork.id === chainId);

  if (targetNetwork) {
    return { ...targetNetwork, ...NETWORKS_EXTRA_DATA[targetNetwork.id] };
  }

  return globalTargetNetwork;
}

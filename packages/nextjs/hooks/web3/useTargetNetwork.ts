import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import appConfig from "~~/app.config";
import { useGlobalState } from "~~/services/store/store";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/web3/networks";

/**
 * Retrieves the connected wallet's network from app.config or defaults to the 0th network in the list if the wallet is not connected.
 */
export function useTargetNetwork(): { targetNetwork: ChainWithAttributes } {
  const { chain } = useAccount();
  const targetNetwork = useGlobalState(({ targetNetwork }) => targetNetwork);
  const setTargetNetwork = useGlobalState(({ setTargetNetwork }) => setTargetNetwork);

  useEffect(() => {
    const newSelectedNetwork = appConfig.targetNetworks.find(targetNetwork => targetNetwork.id === chain?.id);
    if (newSelectedNetwork && newSelectedNetwork.id !== targetNetwork.id) {
      setTargetNetwork({ ...newSelectedNetwork, ...NETWORKS_EXTRA_DATA[newSelectedNetwork.id] });
    }
  }, [chain?.id, setTargetNetwork, targetNetwork.id]);

  return useMemo(() => ({ targetNetwork }), [targetNetwork]);
}

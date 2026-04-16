"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { toast } from "react-hot-toast";
import { getContract, parseAbiItem, Address } from "viem";
import { ASSET_REGISTRY_ADDRESS, assetRegistryContractConfig } from "~~/utils/web3/assetRegistry";

type Asset = {
  id: number;
  name: string;
  assetType: string;
  valuation: number;
};

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const contract = useMemo(() => {
    if (!publicClient) return null;
    return getContract({
      address: ASSET_REGISTRY_ADDRESS,
      abi: assetRegistryContractConfig.abi,
      client: publicClient,
    });
  }, [publicClient]);

  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [assetHistory, setAssetHistory] = useState<Record<number, any[]>>({});

  const { data: myTotalBalance } = useReadContract({
    address: ASSET_REGISTRY_ADDRESS,
    abi: assetRegistryContractConfig.abi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress as Address] : undefined,
    query: {
      enabled: Boolean(connectedAddress),
    },
  }) as { data?: bigint };

  const { writeContractAsync } = useWriteContract();

  const handleTransfer = async (tokenId: number) => {
    if (!connectedAddress) {
      toast.error("Connect your wallet to transfer assets");
      return;
    }

    const to = prompt("Enter recipient address (0x...)");
    if (!to || !to.startsWith("0x") || to.length !== 42) {
      toast.error("Invalid address");
      return;
    }

    try {
      if (!publicClient) {
        toast.error("Unable to access public client");
        return;
      }

      const transferContract = getContract({
        address: ASSET_REGISTRY_ADDRESS,
        abi: assetRegistryContractConfig.abi,
        client: publicClient,
      });

      const tokenIdsBefore = (await Promise.all(
        Array.from({ length: Number(myTotalBalance || 0n) }, (_, index) =>
          transferContract.read.tokenOfOwnerByIndex([connectedAddress as Address, BigInt(index)]),
        ),
      )) as bigint[];

      console.debug("[MyHoldings] tokenIds before transfer", tokenIdsBefore.map(id => id.toString()));

      const txResult = (await writeContractAsync({
        address: ASSET_REGISTRY_ADDRESS,
        abi: assetRegistryContractConfig.abi,
        functionName: "transferAsset",
        args: [connectedAddress as Address, to as Address, BigInt(tokenId)],
      })) as { wait?: () => Promise<any> } | string | undefined;

      if (typeof txResult === "object" && typeof (txResult as { wait?: unknown }).wait === "function") {
        await (txResult as { wait: () => Promise<any> }).wait();
      } else if (typeof txResult === "string") {
        await publicClient.waitForTransactionReceipt({ hash: txResult as `0x${string}` });
      }

      toast.success("Asset transferred");
      const updatedAssets = await updateMyAssets();
      console.debug("[MyHoldings] tokenIds after transfer", updatedAssets?.map(asset => asset.id));
      await fetchAssetHistory();
    } catch (e: any) {
      if (e?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error("Transfer failed");
      }
      return;
    }
  };

  const updateMyAssets = useCallback(async (): Promise<Asset[] | undefined> => {
    if (!publicClient || !connectedAddress) return;

    const freshContract = getContract({
      address: ASSET_REGISTRY_ADDRESS,
      abi: assetRegistryContractConfig.abi,
      client: publicClient,
    });

    setAllCollectiblesLoading(true);

    try {
      const balance = await freshContract.read.balanceOf([connectedAddress as Address]);
      const total = Number(balance);

      console.debug("[MyHoldings] updateMyAssets", {
        contractAddress: ASSET_REGISTRY_ADDRESS,
        connectedAddress,
        total,
        chainId: publicClient?.chain?.id,
      });

      if (total === 0) {
        setMyAssets([]);
        return;
      }

      const tokenIds = (await Promise.all(
        Array.from({ length: total }, (_, index) =>
          freshContract.read.tokenOfOwnerByIndex([connectedAddress as Address, BigInt(index)]),
        ),
      )) as bigint[];

      console.debug("[MyHoldings] tokenIds fetched", tokenIds.map((id: bigint) => id.toString()));

      const assets: Array<Asset | null> = await Promise.all(
        tokenIds.map(async (tokenId: bigint) => {
          try {
            const asset = (await freshContract.read.getAsset([tokenId])) as {
              name: string;
              assetType: string;
              valuation: bigint;
            };
            return {
              id: Number(tokenId),
              name: asset.name,
              assetType: asset.assetType,
              valuation: Number(asset.valuation),
            };
          } catch (error) {
            console.error("[MyHoldings] getAsset failed", tokenId.toString(), error);
            return null;
          }
        }),
      );

      const validAssets = assets.filter((asset): asset is Asset => asset !== null);
      validAssets.sort((a, b) => a.id - b.id);
      setMyAssets([...validAssets]);
      return validAssets;
    } catch (error) {
      console.error("[MyHoldings] updateMyAssets failed", error);
    } finally {
      setAllCollectiblesLoading(false);
    }
  }, [connectedAddress, publicClient]);

  const fetchAssetHistory = useCallback(async () => {
    if (!publicClient || !connectedAddress) return;

    try {
      const transferEvent = parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      );

      const logs = await publicClient.getLogs({
        address: ASSET_REGISTRY_ADDRESS,
        fromBlock: 0n,
        event: transferEvent,
      });

      console.debug("[MyHoldings] fetched transfer logs", {
        contractAddress: ASSET_REGISTRY_ADDRESS,
        connectedAddress,
        logCount: logs.length,
      });

      const historyMap: Record<number, Array<{ from: string; to: string }>> = {};
      const lowerAddress = connectedAddress.toLowerCase();

      logs
        .map(log => {
          const args = log.args as { from: string; to: string; tokenId: bigint };
          return {
            tokenId: Number(args.tokenId),
            from: args.from,
            to: args.to,
          };
        })
        .filter(event => event.from.toLowerCase() === lowerAddress || event.to.toLowerCase() === lowerAddress)
        .forEach(event => {
          if (!historyMap[event.tokenId]) {
            historyMap[event.tokenId] = [];
          }

          historyMap[event.tokenId].push({
            from: event.from,
            to: event.to,
          });
        });

      setAssetHistory(historyMap);
    } catch (e) {
      console.error("[MyHoldings] fetchAssetHistory failed", e);
    }
  }, [publicClient, connectedAddress]);

  useEffect(() => {
    if (publicClient?.chain?.id && publicClient.chain.id !== 11155111) {
      console.warn("[MyHoldings] expected Sepolia chainId 11155111, got", publicClient.chain.id);
    }

    updateMyAssets();
    fetchAssetHistory();
  }, [connectedAddress, myTotalBalance, updateMyAssets, fetchAssetHistory]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      {myAssets.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No Assets Found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center mt-8">
          {myAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-gradient-to-br from-slate-900 to-slate-800 
             border border-slate-700 rounded-xl p-4 w-72 
             shadow-lg hover:shadow-xl transition-all"
            >
              <img
                src={`https://robohash.org/${asset.id}?set=set2`}
                className="w-full h-36 rounded-md mb-3 object-cover"
              />
              <h2 className="text-lg font-semibold text-white">{asset.name}</h2>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Type: {asset.assetType}</p>
              <p className="text-lg font-bold text-white">Value: ${asset.valuation}</p>
              <p className="text-xs opacity-60">Token ID: {asset.id}</p>

              {/* History */}
              <div className="mt-3">
                <p className="font-semibold text-sm">History:</p>

                {assetHistory[asset.id]?.length ? (
                  <div className="overflow-x-auto mt-2">
                    <table className="min-w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-slate-300 pb-2">From</th>
                          <th className="text-left text-slate-300 pb-2">To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetHistory[asset.id].map((event, idx) => (
                          <tr key={`${asset.id}-${idx}`}>
                            <td className="pr-2 py-1 opacity-80">
                              {event.from === "0x0000000000000000000000000000000000000000"
                                ? "Minted"
                                : `${event.from.slice(0, 6)}...${event.from.slice(-4)}`}
                            </td>
                            <td className="py-1 opacity-80">
                              {event.to === "0x0000000000000000000000000000000000000000"
                                ? "Burned"
                                : `${event.to.slice(0, 6)}...${event.to.slice(-4)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs opacity-50">No history</p>
                )}
              </div>

              {/* Transfer button */}
              <button className="btn btn-sm btn-primary mt-2" onClick={() => handleTransfer(asset.id)}>
                Transfer
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

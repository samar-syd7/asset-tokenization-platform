"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type Asset = {
  id: number;
  name: string;
  assetType: string;
  valuation: number;
};

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [assetHistory, setAssetHistory] = useState<Record<number, any[]>>({});

  const { data: assetRegistryContract } = useScaffoldContract({
    contractName: "AssetRegistry",
  });

  const { data: myTotalBalance } = useScaffoldReadContract({
    contractName: "AssetRegistry",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "AssetRegistry" });

  const handleTransfer = async (tokenId: number) => {
    const to = prompt("Enter recipient address (0x...)");
    if (!to || !to.startsWith("0x") || to.length !== 42) {
      notification.error("Invalid address");
      return;
    }

    try {
      await writeContractAsync({
        functionName: "transferAsset",
        args: [connectedAddress, to, BigInt(tokenId)],
      });

      notification.success("Asset transferred");

      setTimeout(() => {
        updateMyAssets();
      }, 1000);
    } catch (e: any) {
      if (e?.message?.includes("User rejected")) {
        notification.warning("Transaction cancelled");
      } else {
        notification.error("Transfer failed");
      }
    }
  };

  const updateMyAssets = async (): Promise<void> => {
    if (!assetRegistryContract || !connectedAddress || myTotalBalance === undefined) return;

    setAllCollectiblesLoading(true);

    const assets: Asset[] = [];
    const total = Number(myTotalBalance);

    for (let i = 0; i < total; i++) {
      try {
        const tokenId = await assetRegistryContract.read.tokenOfOwnerByIndex([connectedAddress, BigInt(i)]);

        const asset = await assetRegistryContract.read.getAsset([tokenId]);

        assets.push({
          id: Number(tokenId),
          name: asset.name,
          assetType: asset.assetType,
          valuation: Number(asset.valuation),
        });
      } catch (e) {
        console.warn("Event fetch failed (non-critical)", e);
      }
    }

    assets.sort((a, b) => a.id - b.id);
    setMyAssets(assets);
    setAllCollectiblesLoading(false);
  };

  const fetchAssetHistory = async () => {
    if (!assetRegistryContract) return;

    try {
      const events = await assetRegistryContract.getEvents.Transfer();

      const historyMap: Record<number, any[]> = {};

      events.forEach((event: any) => {
        const tokenId = Number(event.args.tokenId);

        if (!historyMap[tokenId]) {
          historyMap[tokenId] = [];
        }

        historyMap[tokenId].push({
          from: event.args.from,
          to: event.args.to,
        });
      });

      setAssetHistory(historyMap);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    updateMyAssets();
    fetchAssetHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, myTotalBalance]);

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
                  assetHistory[asset.id].map((event, idx) => (
                    <div key={`${asset.id}-${idx}`} className="text-xs opacity-70">
                      {event.from === "0x0000000000000000000000000000000000000000" ? "Minted" : "Transferred"} →{" "}
                      {event.to.slice(0, 6)}...{event.to.slice(-4)}
                    </div>
                  ))
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

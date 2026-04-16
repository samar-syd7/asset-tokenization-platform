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
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferAsset, setSelectedTransferAsset] = useState<Asset | null>(null);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [isTransferPending, setIsTransferPending] = useState(false);

  const openTransferModal = (asset: Asset) => {
    setSelectedTransferAsset(asset);
    setTransferRecipient("");
    setTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setTransferModalOpen(false);
    setSelectedTransferAsset(null);
    setTransferRecipient("");
  };

  const confirmTransfer = async () => {
    if (!selectedTransferAsset) return;
    if (!transferRecipient || !transferRecipient.startsWith("0x") || transferRecipient.length !== 42) {
      toast.error("Invalid recipient address");
      return;
    }

    closeTransferModal();
    await handleTransfer(selectedTransferAsset.id, transferRecipient);
  };

  const handleTransfer = async (tokenId: number, toAddress: string) => {
    if (!connectedAddress) {
      toast.error("Connect your wallet to transfer assets");
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
        args: [connectedAddress as Address, toAddress as Address, BigInt(tokenId)],
      })) as { wait?: () => Promise<any> } | string | undefined;

      const previousAssets = myAssets;
      const removedAsset = myAssets.find(asset => asset.id === tokenId);
      if (removedAsset) {
        setMyAssets(prev => prev.filter(asset => asset.id !== tokenId));
      }
      setIsTransferPending(true);
      toast.success("Asset transfer submitted");

      (async () => {
        try {
          if (typeof txResult === "object" && typeof (txResult as { wait?: unknown }).wait === "function") {
            await (txResult as { wait: () => Promise<any> }).wait();
          } else if (typeof txResult === "string") {
            await publicClient.waitForTransactionReceipt({ hash: txResult as `0x${string}` });
          }

          const updatedAssets = await updateMyAssets(true);
          console.debug("[MyHoldings] tokenIds after transfer", updatedAssets?.map(asset => asset.id));
          await fetchAssetHistory();
        } catch (confirmError) {
          console.error("[MyHoldings] transfer confirmation failed", confirmError);
          setMyAssets(previousAssets);
          toast.error("Transfer failed. Restoring your assets.");
        } finally {
          setIsTransferPending(false);
        }
      })();
    } catch (e: any) {
      if (e?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error("Transfer failed");
      }
      setIsTransferPending(false);
      return;
    }
  };

  const updateMyAssets = useCallback(async (silent = false): Promise<Asset[] | undefined> => {
    if (!publicClient || !connectedAddress) return;

    const freshContract = getContract({
      address: ASSET_REGISTRY_ADDRESS,
      abi: assetRegistryContractConfig.abi,
      client: publicClient,
    });

    if (!silent) {
      setAllCollectiblesLoading(true);
    }

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
      if (!silent) {
        setAllCollectiblesLoading(false);
      }
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

  const totalValue = myAssets.reduce((sum, asset) => sum + asset.valuation, 0);
  const uniqueTypes = new Set(myAssets.map(asset => asset.assetType)).size;
  const walletShort = connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Not connected";
  const isRecipientValid = transferRecipient.startsWith("0x") && transferRecipient.length === 42;

  useEffect(() => {
    if (publicClient?.chain?.id && publicClient.chain.id !== 11155111) {
      console.warn("[MyHoldings] expected Sepolia chainId 11155111, got", publicClient.chain.id);
    }

    updateMyAssets();
    fetchAssetHistory();
  }, [connectedAddress, myTotalBalance, updateMyAssets, fetchAssetHistory]);

  return (
    <>
      {transferModalOpen && selectedTransferAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Transfer Asset</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedTransferAsset.name}</h2>
                <p className="text-sm text-slate-400">Token ID #{selectedTransferAsset.id}</p>
              </div>
              <button className="btn btn-ghost btn-square text-slate-300" onClick={closeTransferModal}>
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <label className="label pb-2">
                  <span className="label-text text-slate-300">Recipient wallet address</span>
                </label>
                <input
                  type="text"
                  value={transferRecipient}
                  onChange={e => setTransferRecipient(e.target.value)}
                  placeholder="0x..."
                  className="input input-bordered w-full bg-slate-950/85 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button className="btn btn-ghost btn-outline" onClick={closeTransferModal}>
                Cancel
              </button>
              <button
                className={`btn btn-primary ${isTransferPending ? "loading" : ""}`}
                onClick={confirmTransfer}
                disabled={!isRecipientValid || isTransferPending}
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-cyan-300">Portfolio dashboard</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">My Asset Registry</h1>
              <p className="mt-3 text-slate-400">Track your tokenized real-world assets with modern Web3 controls, instant transfers, and full on-chain visibility.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Assets</p>
                <p className="mt-3 text-3xl font-semibold text-white">{myAssets.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Total value</p>
                <p className="mt-3 text-3xl font-semibold text-white">${totalValue.toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wallet</p>
                <p className="mt-3 text-3xl font-semibold text-white">{walletShort}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Asset types</p>
              <p className="mt-2 text-xl font-semibold text-white">{uniqueTypes}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Connected</p>
              <p className="mt-2 text-xl font-semibold text-white">{connectedAddress ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Sync status</p>
              <p className="mt-2 text-xl font-semibold text-white">Live</p>
            </div>
          </div>
        </div>

        {allCollectiblesLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl animate-pulse">
                <div className="h-52 rounded-[1.5rem] bg-slate-800" />
                <div className="mt-6 h-5 w-3/4 rounded-full bg-slate-800" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-24 rounded-full bg-slate-800" />
                  <div className="h-8 w-20 rounded-full bg-slate-800" />
                </div>
                <div className="mt-6 h-10 w-full rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        ) : myAssets.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-center shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900/80 text-4xl">📦</div>
            <h2 className="text-3xl font-semibold text-white">No assets found</h2>
            <p className="mt-3 text-slate-400">Your wallet does not currently own any registered assets. Start by registering an asset or receiving a transfer.</p>
            <button
              className="btn btn-primary mt-8 rounded-full px-8 py-4 text-base"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Register your first asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myAssets.map(asset => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-950/80 to-slate-900/90 p-6 shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="pointer-events-none absolute inset-x-4 top-4 h-28 rounded-[1.75rem] bg-gradient-to-br from-cyan-500/15 via-sky-500/10 to-indigo-500/0 blur-2xl" />
                <img
                  src={`https://robohash.org/${asset.id}?set=set2`}
                  alt={asset.name}
                  className="relative h-44 w-full rounded-[1.5rem] border border-white/10 object-cover shadow-inner"
                />
                <div className="relative mt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-sm badge-primary bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">{asset.assetType}</span>
                    <span className="badge badge-sm badge-secondary bg-white/5 text-white border border-white/10">Val ${asset.valuation}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">{asset.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">Token ID #{asset.id}</p>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Recent activity</p>
                  {assetHistory[asset.id]?.length ? (
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      {assetHistory[asset.id].slice(-2).map((event, idx) => (
                        <div key={`${asset.id}-${idx}`} className="rounded-2xl bg-white/5 p-3">
                          <p>{event.from === "0x0000000000000000000000000000000000000000" ? "Minted" : "Transferred"}</p>
                          <p className="text-slate-400">To {event.to.slice(0, 6)}...{event.to.slice(-4)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">No transfers yet</p>
                  )}
                </div>

                <button
                  className="btn btn-primary mt-5 w-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 text-white transition-transform duration-200 hover:-translate-y-0.5"
                  onClick={() => openTransferModal(asset)}
                >
                  Transfer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

"use client";

import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient, useWatchContractEvent } from "wagmi";
import { ASSET_REGISTRY_ADDRESS, assetRegistryContractConfig } from "~~/utils/web3/assetRegistry";
import { getBlockExplorerAddressLink, getBlockExplorerTxLink } from "~~/utils/web3/networks";

type TransferEvent = {
  tokenId: number;
  from: string;
  to: string;
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
};

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const Transfers = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [transferEvents, setTransferEvents] = useState<TransferEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dedupeKey = (transfer: TransferEvent) => `${transfer.tokenId}-${transfer.from}-${transfer.to}`;

  useWatchContractEvent({
    address: ASSET_REGISTRY_ADDRESS,
    abi: assetRegistryContractConfig.abi,
    chainId: 11155111,
    eventName: "Transfer",
    onLogs(logs) {
      console.log("New logs:", logs);
      if (!address) return;

      const lowerAddress = address.toLowerCase();
      const newTransfers = logs
        .map(log => {
          const args = (log as any).args as { from: string; to: string; tokenId: bigint };
          return {
            tokenId: Number(args.tokenId),
            from: args.from,
            to: args.to,
            blockNumber: log.blockNumber ?? 0n,
            transactionHash: log.transactionHash ?? "",
            logIndex: log.logIndex ?? 0,
          };
        })
        .filter(event => event.from.toLowerCase() === lowerAddress || event.to.toLowerCase() === lowerAddress);

      setTransferEvents(prev => {
        const merged = [...newTransfers, ...prev];
        const unique = Array.from(new Map(merged.map(t => [dedupeKey(t), t])).values());
        return unique.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      });
    },
    enabled: Boolean(publicClient && address),
  });

  useEffect(() => {
    if (!publicClient || !address) return;

    const fetchTransfers = async () => {
      setIsLoading(true);
      try {
        if (publicClient.chain?.id !== 11155111) {
          console.warn("Transfer history is only supported on Sepolia for this deployment.", publicClient.chain.id);
        }

        const transferEvent = parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        );

        console.log("address:", address, "chainId:", publicClient.chain?.id);

        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 5000n ? latestBlock - 5000n : 1n;

        const logs = await publicClient.getLogs({
          address: ASSET_REGISTRY_ADDRESS,
          fromBlock,
          event: transferEvent,
        });

        console.log("Fetched logs:", logs);

        const transfers = logs
          .map(log => {
            const args = (log as any).args as { from: string; to: string; tokenId: bigint };
            return {
              tokenId: Number(args.tokenId),
              from: args.from,
              to: args.to,
              blockNumber: log.blockNumber ?? 0n,
              transactionHash: log.transactionHash ?? "",
              logIndex: log.logIndex ?? 0,
            };
          })
          .filter(event => {
            const lowerAddress = address.toLowerCase();
            return event.from.toLowerCase() === lowerAddress || event.to.toLowerCase() === lowerAddress;
          })
          .sort((a, b) => Number(b.blockNumber - a.blockNumber));

        setTransferEvents(transfers);
      } catch (error) {
        console.error("Failed to load transfer events", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, [publicClient, address]);

  if (!address)
    return (
      <div className="flex justify-center items-center mt-20 text-lg text-slate-400">
        Connect your wallet to view transfer history
      </div>
    );

  return (
    <div className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Transfer History</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Recent asset movements</h1>
              <p className="mt-3 max-w-2xl text-slate-400">
                A high-end ledger view for sent and received transfers, updated instantly as events arrive.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/75 px-5 py-4 text-sm text-slate-300 shadow-lg shadow-slate-950/10">
              <p className="uppercase tracking-[0.35em] text-slate-500">Wallet</p>
              <p className="mt-2 font-semibold text-white">{shortAddress(address)}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-32 rounded-3xl bg-slate-950/80 p-5 shadow-md shadow-slate-950/10 animate-pulse" />
                ))}
              </div>
            ) : transferEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-10 text-center text-slate-400">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-cyan-300">
                  <span className="text-2xl">↺</span>
                </div>
                <p className="text-lg font-semibold text-white">No transfers yet</p>
                <p className="mt-2 text-slate-500">Once you move assets, your activity will appear here in real time.</p>
              </div>
            ) : (
              transferEvents.map((event, index) => {
                const isSent = event.from.toLowerCase() === address.toLowerCase();
                return (
                  <div
                    key={`${event.transactionHash}-${event.logIndex}-${index}`}
                    className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-lg shadow-slate-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">Token #{event.tokenId}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${isSent ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                            {isSent ? "Sent" : "Received"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">Block {event.blockNumber.toString()}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                        {isSent ? "Outgoing" : "Incoming"}
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl bg-slate-900/80 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">From</p>
                        <p className="mt-2 font-medium text-white">{shortAddress(event.from)}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">To</p>
                        <p className="mt-2 font-medium text-white">{shortAddress(event.to)}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-400">
                      <span>Tx hash: {shortAddress(event.transactionHash)}</span>
                      <a
                        className="text-cyan-300 hover:text-cyan-200"
                        href={publicClient?.chain ? getBlockExplorerTxLink(publicClient.chain.id, event.transactionHash) : undefined}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on explorer
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfers;

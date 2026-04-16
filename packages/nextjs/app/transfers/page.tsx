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
        const unique = Array.from(
          new Map(merged.map(t => [dedupeKey(t), t])).values(),
        );
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
    <div className="flex flex-col items-center pt-10 px-5">
      <div className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl font-bold">Transfer History</h1>
        <p className="mt-2 text-slate-500">
          Track your asset transfers and ownership changes on-chain.
        </p>
      </div>

      <div className="overflow-x-auto w-full max-w-5xl shadow-lg">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="text-base-content">
              <th className="bg-primary">Token Id</th>
              <th className="bg-primary">Block</th>
              <th className="bg-primary">From</th>
              <th className="bg-primary">To</th>
              <th className="bg-primary">Tx</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  <span className="loading loading-spinner loading-xl"></span>
                </td>
              </tr>
            ) : transferEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  No transfers yet
                </td>
              </tr>
            ) : (
              transferEvents.map((event, index) => (
                <tr key={`${event.transactionHash}-${event.logIndex}-${index}`}>
                  <th className="text-center">{event.tokenId}</th>
                  <td className="text-center">{event.blockNumber.toString()}</td>
                  <td>
                    <span>{shortAddress(event.from)}</span>
                  </td>
                  <td>
                    <a
                      className="link"
                      href={publicClient?.chain ? getBlockExplorerAddressLink(publicClient.chain, event.to) : undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortAddress(event.to)}
                    </a>
                  </td>
                  <td>
                    <a
                      className="link link-hover"
                      href={publicClient?.chain ? getBlockExplorerTxLink(publicClient.chain.id, event.transactionHash) : undefined}
                      title={event.transactionHash}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortAddress(event.transactionHash)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transfers;

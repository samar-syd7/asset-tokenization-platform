"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, getEventSelector } from "viem";
import type { Abi } from "abitype";
import { useAccount, usePublicClient } from "wagmi";
import AssetRegistryArtifact from "../../../hardhat/deployments/sepolia/AssetRegistry.json";
import { ASSET_REGISTRY_ADDRESS } from "~~/utils/web3/assetRegistry";
import { getBlockExplorerAddressLink } from "~~/utils/web3/networks";

type TransferEvent = {
  args: {
    from: string;
    to: string;
    tokenId: bigint;
  };
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
};

const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
const assetRegistryAbi = AssetRegistryArtifact.abi as Abi;

const Transfers = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [transferEvents, setTransferEvents] = useState<TransferEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchTransfers = async () => {
      setIsLoading(true);
      try {
        const transferTopic = getEventSelector("Transfer(address,address,uint256)");
        const logs = await publicClient.getLogs({
          address: ASSET_REGISTRY_ADDRESS,
        });

        const decodedEvents = logs
          .filter(log => log.topics?.[0] === transferTopic)
          .map(log => {
            const decoded = decodeEventLog({
              abi: assetRegistryAbi,
              data: log.data,
              topics: log.topics,
              eventName: "Transfer",
            });
            return {
              ...log,
              args: decoded.args as unknown as { from: string; to: string; tokenId: bigint },
            };
          })
          .filter(event => {
            const args = event.args;
            const lowerAddress = address.toLowerCase();
            return args.from.toLowerCase() === lowerAddress || args.to.toLowerCase() === lowerAddress;
          });

        const uniqueEvents = Array.from(
          new Map(decodedEvents.map(event => [`${event.transactionHash}:${event.logIndex}`, event])).values(),
        );

        setTransferEvents(
          uniqueEvents
            .map(event => ({
              args: event.args,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              logIndex: event.logIndex,
            }))
            .sort((a, b) => Number(b.blockNumber - a.blockNumber)),
        );
      } catch (error) {
        console.error("Failed to load transfer events", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, [address, publicClient]);

  const blockExplorerAddressLink = useMemo(
    () =>
      publicClient?.chain && address
        ? getBlockExplorerAddressLink(publicClient.chain, address)
        : undefined,
    [address, publicClient?.chain],
  );

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
              <th className="bg-primary">From</th>
              <th className="bg-primary">To</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="text-center py-6">
                  <span className="loading loading-spinner loading-xl"></span>
                </td>
              </tr>
            ) : transferEvents.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6">
                  No transfers found for your wallet
                </td>
              </tr>
            ) : (
              transferEvents.map((event, index) => (
                <tr key={`${event.transactionHash}-${event.logIndex}-${index}`}>
                  <th className="text-center">{event.args.tokenId.toString()}</th>
                  <td>
                    <div className="flex items-center gap-2">
                      <span>{shortAddress(event.args.from)}</span>
                    </div>
                  </td>
                  <td>
                    <a
                      className="link"
                      href={blockExplorerAddressLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortAddress(event.args.to)}
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

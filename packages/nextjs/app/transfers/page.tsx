"use client";

import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

const Transfers: NextPage = () => {
  const { targetNetwork } = useTargetNetwork();
  const { address } = useAccount();

  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "AssetRegistry",
    eventName: "Transfer",
  });

  // Filter only user's transfers
  const userTransfers = transferEvents?.filter(event =>
    address &&
    (event.args.from?.toLowerCase() === address.toLowerCase() ||
      event.args.to?.toLowerCase() === address.toLowerCase())
  );

  // Sort newest first (optional but recommended)
  const sortedTransfers = [...(userTransfers || [])].sort(
    (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
  );

  // Loading state
  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-xl"></span>
      </div>
    );

  // Wallet not connected
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
            {!sortedTransfers || sortedTransfers.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center">
                  No transfers found for your wallet
                </td>
              </tr>
            ) : (
              sortedTransfers.map((event, index) => (
                <tr key={index}>
                  <th className="text-center">
                    {event.args.tokenId?.toString()}
                  </th>

                  <td>
                    <Address
                      address={event.args.from}
                      chain={targetNetwork}
                    />
                  </td>

                  <td>
                    <Address
                      address={event.args.to}
                      chain={targetNetwork}
                      blockExplorerAddressLink={
                        targetNetwork.id === hardhat.id
                          ? `/blockexplorer/address/${event.args.to}`
                          : undefined
                      }
                    />
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

"use client";

import { useRouter } from "next/navigation";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const { data: assetBalance } = useScaffoldReadContract({
    contractName: "AssetRegistry",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  return (
    <div className="flex flex-col items-center grow pt-16 px-5">
      {/* HERO */}
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold">Asset Registry</h1>

        <p className="mt-4 text-lg text-slate-400">
          Tokenize, track, and transfer ownership of real-world assets on Ethereum.
        </p>

        {/* CTA */}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
            onClick={() => router.push("/my-assets")}
          >
            View My Assets
          </button>

          <button
            className="border border-slate-600 text-slate-300 px-6 py-2 rounded-lg"
            onClick={() => router.push("/transfers")}
          >
            View Transfers
          </button>
        </div>
      </div>

      {/* WALLET + STATS */}
      <div className="mt-12 w-full max-w-3xl">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-400">Connected Wallet</p>

            <Address address={connectedAddress} chain={targetNetwork} />

            <div className="border-t border-slate-700 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assets count */}
              <div className="bg-slate-800 rounded-xl p-6">
                <p className="text-xs uppercase text-slate-500">Total Assets</p>
                <p className="mt-2 text-4xl font-semibold text-white">
                  {connectedAddress ? Number(assetBalance ?? 0) : "—"}
                </p>
              </div>

              {/* Platform info */}
              <div className="bg-slate-800 rounded-xl p-6 text-left">
                <p className="text-xs uppercase text-slate-500">System</p>
                <p className="mt-2 text-sm text-slate-300">
                  Decentralized registry for asset ownership, enabling transparent transfers and verifiable history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

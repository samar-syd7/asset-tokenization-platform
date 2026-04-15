"use client";

import { useState } from "react";
import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const MyNFTs: NextPage = () => {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [valuation, setValuation] = useState("");
  const [metadata, setMetadata] = useState("");

  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "AssetRegistry" });

  const handleRegisterAsset = async () => {
    if (!connectedAddress) return;

    try {
      await writeContractAsync({
        functionName: "mintAsset",
        args: [connectedAddress, name, assetType, BigInt(Math.floor(Number(valuation) || 0)), metadata || ""],
      });

      notification.success("Asset registered successfully");
      setName("");
      setAssetType("");
      setValuation("");
      setMetadata("");
    } catch (error) {
      console.error(error);
      notification.error("Asset registration failed");
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 px-5">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl font-bold">My Assets</h1>
        <p className="mt-2 text-slate-500">
          Register new assets, see your holdings, and transfer ownership to other wallets.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        {!isConnected || isConnecting ? (
          <div className="flex justify-center">
            <RainbowKitCustomConnectButton />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-base-100 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Register New Asset</h2>
              <div className="flex flex-col gap-4">
                <input
                  className="input input-bordered"
                  placeholder="Asset Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <input
                  className="input input-bordered"
                  placeholder="Asset Type"
                  value={assetType}
                  onChange={e => setAssetType(e.target.value)}
                />
                <input
                  className="input input-bordered"
                  placeholder="Valuation (USD)"
                  type="number"
                  value={valuation}
                  onChange={e => setValuation(e.target.value)}
                />
                <input
                  className="input input-bordered"
                  placeholder="Metadata URI (optional)"
                  value={metadata}
                  onChange={e => setMetadata(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={handleRegisterAsset}>
                  Register Asset
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-base-100 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Asset Ledger</h2>
              <p className="text-slate-600">Your registered assets and ownership information are stored on-chain.</p>
            </div>
          </div>
        )}
      </div>

      <MyHoldings />
    </div>
  );
};

export default MyNFTs;

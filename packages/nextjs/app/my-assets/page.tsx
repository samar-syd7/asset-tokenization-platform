"use client";

import { useState } from "react";
import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "react-hot-toast";
import { assetRegistryContractConfig, ASSET_REGISTRY_ADDRESS } from "~~/utils/web3/assetRegistry";

const CONTRACT_ADDRESS = ASSET_REGISTRY_ADDRESS;

const MyAssets: NextPage = () => {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [valuation, setValuation] = useState("");
  const [metadata, setMetadata] = useState("");

  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handleRegisterAsset = async () => {
    if (!connectedAddress) return;

    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: assetRegistryContractConfig.abi,
        functionName: "mintAsset",
        args: [
          connectedAddress,
          name,
          assetType,
          BigInt(Math.floor(Number(valuation) || 0)),
          metadata || "",
        ],
      });

      toast.success("Asset registered successfully");

      setName("");
      setAssetType("");
      setValuation("");
      setMetadata("");
    } catch (error) {
      console.error(error);
      toast.error("Asset registration failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Managed Holdings</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">My Assets</h1>
              <p className="mt-4 text-slate-400 leading-7">
                Register assets, review your portfolio cards, and transfer ownership from a premium Web3 control plane.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300 shadow-lg shadow-slate-950/10">
              <span className="rounded-full bg-slate-900 px-3 py-2">Sepolia</span>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/30 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-2xl font-semibold text-white">Register New Asset</h2>
            <p className="mt-3 text-slate-400">Create your tokenized ownership entries and grow your on-chain portfolio.</p>

            <div className="mt-8 grid gap-4">
              <input
                className="rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Asset Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className="rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Asset Type"
                value={assetType}
                onChange={e => setAssetType(e.target.value)}
              />
              <input
                className="rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Valuation (USD)"
                type="number"
                value={valuation}
                onChange={e => setValuation(e.target.value)}
              />
              <input
                className="rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Metadata URI (optional)"
                value={metadata}
                onChange={e => setMetadata(e.target.value)}
              />
              <button
                className="rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-400"
                onClick={handleRegisterAsset}
              >
                Register Asset
              </button>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-cyan-500/10 p-8 shadow-xl shadow-cyan-500/10">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Asset Ledger</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Modern asset management</h3>
                <p className="mt-4 text-slate-300 leading-7">
                  Your holdings appear below in a premium asset card layout, ready for transfers and portfolio tracking.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="rounded-3xl bg-slate-950/90 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Verified chain</p>
                  <p className="mt-2 text-lg font-semibold text-white">Sepolia Testnet</p>
                </div>
                <div className="rounded-3xl bg-slate-950/90 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Transfer-ready</p>
                  <p className="mt-2 text-lg font-semibold text-white">Instant updates and secure ownership flows</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <MyHoldings />
        </div>
      </div>
    </div>
  );
};

export default MyAssets;
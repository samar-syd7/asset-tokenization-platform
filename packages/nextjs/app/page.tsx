"use client";

import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount, useContractRead } from "wagmi";
import { assetRegistryContractConfig, ASSET_REGISTRY_ADDRESS } from "~~/utils/web3/assetRegistry";

const Home: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();

  const { data: assetBalance } = useContractRead({
    address: ASSET_REGISTRY_ADDRESS,
    abi: assetRegistryContractConfig.abi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress as `0x${string}`] : undefined,
    watch: Boolean(connectedAddress),
    enabled: Boolean(connectedAddress),
  });

  const formattedAddress = connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Connect wallet";
  const assetCount = connectedAddress ? Number(assetBalance ?? 0) : 0;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Real World Asset Registry</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">Finance-grade asset ownership for modern Web3 portfolios.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Manage tokenized real-world assets with a clean dashboard, transparent transfer history, and trusted on-chain verification.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => router.push("/my-assets")}
                className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-8 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-400"
              >
                View My Assets
              </button>
              <button
                onClick={() => router.push("/transfers")}
                className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-cyan-300 hover:text-cyan-200"
              >
                Transfer History
              </button>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wallet</p>
                <p className="mt-3 text-xl font-semibold text-white">{formattedAddress}</p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Total Assets</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{assetCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Network</p>
                  <p className="mt-3 text-xl font-semibold text-white">Sepolia Testnet</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Overview</h2>
            <p className="mt-4 text-slate-400 leading-7">
              Access your assets, monitor transfers, and keep your ownership portfolio in sync with a polished experience built for Web3 professionals.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/70 to-violet-500/10 p-8 shadow-xl shadow-cyan-500/10">
            <h2 className="text-xl font-semibold text-white">Why this matters</h2>
            <ul className="mt-6 space-y-4 text-slate-400">
              <li className="rounded-3xl bg-slate-950/70 p-4">Secure ownership records with transparent transfer tracking.</li>
              <li className="rounded-3xl bg-slate-950/70 p-4">Keep asset data organized for modern finance workflows.</li>
              <li className="rounded-3xl bg-slate-950/70 p-4">Use a clean dashboard that fits enterprise-grade digital asset tooling.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

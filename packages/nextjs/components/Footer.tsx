"use client";

export const Footer = () => {
  return (
    <footer className="w-full border-t mt-10 py-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">

        <h2 className="font-semibold text-lg">
          Asset Registry
        </h2>

        <p className="text-sm opacity-70 max-w-md">
          Tokenizing and tracking ownership of real-world assets on Ethereum.
        </p>

        <p className="text-xs opacity-50">
          Built on Ethereum • Sepolia Testnet
        </p>

        <div className="flex gap-4 mt-2 text-xs opacity-60">
          <span>© {new Date().getFullYear()}</span>
          <span>•</span>
          <span>All rights reserved</span>
        </div>

      </div>
    </footer>
  );
};
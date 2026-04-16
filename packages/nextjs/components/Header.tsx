"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useOutsideClick } from "~~/hooks/web3/useOutsideClick";
import { useTargetNetwork } from "~~/hooks/web3/useTargetNetwork";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "My Assets",
    href: "/my-assets",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "Transfers",
    href: "/transfers",
    icon: <ArrowPathIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-2 list-none p-0 m-0">
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href} className="list-none">
            <Link
              href={href}
              className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-200 shadow-lg shadow-cyan-500/10"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export const Header = () => {
  useTargetNetwork();

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-xl shadow-slate-950/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 ring-1 ring-cyan-200/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
              <span className="text-xl font-semibold">AR</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Asset Registry</p>
              <p className="text-sm text-slate-500">Real-world ownership</p>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <HeaderMenuLinks />
        </nav>

        <div className="flex items-center gap-3">
          <SwitchTheme className="scale-90 opacity-80 hover:opacity-100" />
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>

        <details className="dropdown dropdown-end md:hidden" ref={burgerMenuRef}>
          <summary className="btn btn-ghost btn-square">
            <Bars3Icon className="h-5 w-5 text-slate-200" />
          </summary>
          <ul
            className="dropdown-content mt-2 w-56 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-xl shadow-slate-950/20 backdrop-blur-xl"
            onClick={() => burgerMenuRef?.current?.removeAttribute("open")}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
      </div>
    </header>
  );
};

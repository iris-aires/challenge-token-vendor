"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon } from "@heroicons/react/24/outline";
import { BoltIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Token Vendor",
    href: "/token-vendor",
    icon: <CircleStackIcon className="h-4 w-4" />,
  },
  {
    label: "Events",
    href: "/events",
    icon: <BoltIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href} className="h-full">
            <Link
              href={href}
              passHref
              aria-current={isActive ? "page" : undefined}
              className={`${
                isActive ? "nav-active" : ""
              } nav-link h-full px-4 text-sm gap-2 flex items-center whitespace-nowrap`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="site-header sticky top-0 navbar min-h-20 shrink-0 justify-between z-20">
      <div className="navbar-start w-auto self-stretch">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary aria-label="Open navigation" className="btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-lg bg-base-100 w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" className="brand flex items-center gap-2.5 mr-6 shrink-0" aria-label="Token Vendor home">
          <span className="brand-mark">
            <CircleStackIcon className="h-6 w-6" />
          </span>
          <span className="hidden sm:block font-semibold tracking-tight">
            Token Vendor
            <span className="block text-[10px] tracking-[0.2em] uppercase opacity-50">Onchain exchange</span>
          </span>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap h-full m-0 p-0 list-none">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end w-auto gap-2 sm:gap-3">
        <RainbowKitCustomConnectButton />
        <SwitchTheme />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};

"use client";

import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  ArrowDownLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="home-page page-shell">
      <section className="hero-section">
        <div className="hero-glow" aria-hidden="true" />
        <div className="eyebrow">
          <span className="status-dot" /> THE ONCHAIN TOKEN EXPERIENCE
        </div>
        <h1>
          Your tokens.
          <br />
          Your wallet.
          <br />
          <span className="text-primary">Your control.</span>
        </h1>
        <div className="hero-bottom">
          <Link href="/token-vendor" className="btn btn-primary hero-cta">
            Open exchange <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </Link>
          <p>
            A simple gateway to Lumen.
            <br />
            Explore ERC-20 tokens directly from your wallet.
          </p>
          <div className="hero-network">
            <span className="muted text-xs">CONNECTED NETWORK</span>
            <span className="flex items-center gap-2 mt-2">
              <span className="status-dot" />
              {targetNetwork.name}
            </span>
          </div>
        </div>
      </section>

      <section className="feature-grid" aria-label="How Token Vendor works">
        <Link href="/token-vendor" className="feature-card">
          <span className="feature-icon">
            <ArrowsRightLeftIcon />
          </span>
          <span className="eyebrow">DIRECT FROM YOUR WALLET</span>
          <h2>Make your next move.</h2>
          <p>View your Lumen balance and send tokens to any Ethereum address.</p>
          <span className="feature-link">
            Explore Token Vendor <ArrowTopRightOnSquareIcon />
          </span>
        </Link>
        <Link href="/events" className="feature-card">
          <span className="feature-icon">
            <BoltIcon />
          </span>
          <span className="eyebrow">TRANSPARENT BY DESIGN</span>
          <h2>Every trade. Onchain.</h2>
          <p>Follow token purchases with a public record of exchange activity.</p>
          <span className="feature-link">
            View activity <ArrowTopRightOnSquareIcon />
          </span>
        </Link>
        <Link href="/debug" className="feature-card">
          <span className="feature-icon">
            <ShieldCheckIcon />
          </span>
          <span className="eyebrow">POWERED BY SMART CONTRACTS</span>
          <h2>Verify it yourself.</h2>
          <p>Inspect the token and vendor contracts. The code is open to explore.</p>
          <span className="feature-link">
            Explore contracts <ArrowTopRightOnSquareIcon />
          </span>
        </Link>
      </section>

      <section className="account-strip">
        <div className="flex items-center gap-3">
          <ArrowDownLeftIcon className="h-5 w-5 text-primary" />
          <div>
            <span className="eyebrow">YOUR ACCOUNT</span>
            <p className="m-0 text-sm muted">
              {connectedAddress ? "Connected and ready to explore." : "Connect a wallet to get started."}
            </p>
          </div>
        </div>
        {connectedAddress ? (
          <Address address={connectedAddress} chain={targetNetwork} />
        ) : (
          <span className="badge badge-outline">Wallet not connected</span>
        )}
      </section>
    </div>
  );
};

export default Home;

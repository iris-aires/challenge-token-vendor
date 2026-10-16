"use client";

import type { ReactNode } from "react";
import styles from "./DebugContracts.module.css";
import { Address, Balance } from "@scaffold-ui/components";
import { type Address as AddressType, formatUnits } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const LumenContractDetails = ({ address, children }: { address: AddressType; children: ReactNode }) => {
  const { targetNetwork } = useTargetNetwork();
  const { data: name } = useScaffoldReadContract({ contractName: "Lumen", functionName: "name" });
  const { data: symbol } = useScaffoldReadContract({ contractName: "Lumen", functionName: "symbol" });
  const { data: decimals } = useScaffoldReadContract({ contractName: "Lumen", functionName: "decimals" });
  const { data: totalSupply } = useScaffoldReadContract({ contractName: "Lumen", functionName: "totalSupply" });
  const supply = totalSupply !== undefined && decimals !== undefined ? formatUnits(totalSupply, decimals) : undefined;

  return (
    <div className={styles.lumenContract}>
      <aside className="min-w-0 flex flex-col gap-6">
        <div className="bg-base-100 border border-base-300 px-6 lg:px-8 py-4 space-y-1">
          <h2 className="font-bold text-base m-0">Lumen</h2>
          <Address address={address} chain={targetNetwork} onlyEnsOrAddress size="base" />
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold">Balance:</span>
            <Balance address={address} chain={targetNetwork} />
          </div>
          <p className="text-sm m-0">Network: {targetNetwork.name}</p>
        </div>
        <dl className="bg-secondary text-secondary-content px-6 lg:px-8 py-5 space-y-5 m-0">
          <div>
            <dt className="font-medium">decimals</dt>
            <dd className="m-0 mt-1">{decimals !== undefined ? `${decimals} decimal places` : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">name</dt>
            <dd className="m-0 mt-1">{name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">symbol</dt>
            <dd className="m-0 mt-1">{symbol ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium">totalSupply</dt>
            <dd className="m-0 mt-1 text-xl font-semibold tabular-nums break-words">
              {supply !== undefined ? `${supply}${symbol ? ` ${symbol}` : ""}` : "—"}
            </dd>
          </div>
        </dl>
      </aside>
      {children}
    </div>
  );
};

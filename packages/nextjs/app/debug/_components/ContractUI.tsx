"use client";

// @refresh reset
import { LumenContractDetails } from "./LumenContractDetails";
import { Contract } from "@scaffold-ui/debug-contracts";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { ContractName } from "~~/utils/scaffold-eth/contract";

type ContractUIProps = {
  contractName: ContractName;
  className?: string;
};

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({ contractName }: ContractUIProps) => {
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo({ contractName });

  if (deployedContractLoading) {
    return (
      <div className="mt-14">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <p className="text-3xl mt-14">
        No contract found by the name of {contractName} on chain {targetNetwork.name}!
      </p>
    );
  }

  const contract = (
    <Contract contractName={contractName as string} contract={deployedContractData} chainId={targetNetwork.id} />
  );
  return contractName === "Lumen" ? (
    <LumenContractDetails address={deployedContractData.address}>{contract}</LumenContractDetails>
  ) : (
    contract
  );
};

"use client";

import { useState } from "react";
import { AddressInput } from "@scaffold-ui/components";
import { IntegerInput } from "@scaffold-ui/debug-contracts";
import { useWatchBalance } from "@scaffold-ui/hooks";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getTokenPrice, multiplyTo1e18 } from "~~/utils/scaffold-eth/priceInWei";

const TokenVendor: NextPage = () => {
  const [toAddress, setToAddress] = useState("");
  const [tokensToSend, setTokensToSend] = useState("");
  const [tokensToBuy, setTokensToBuy] = useState<string | bigint>("");
  const [isApproved, setIsApproved] = useState(false);
  const [tokensToSell, setTokensToSell] = useState<string>("");

  const { address } = useAccount();
  const { data: lumenSymbol } = useScaffoldReadContract({
    contractName: "Lumen",
    functionName: "symbol",
  });

  const { data: lumenBalance } = useScaffoldReadContract({
    contractName: "Lumen",
    functionName: "balanceOf",
    args: [address],
  });

  const { data: vendorContractData } = useDeployedContractInfo({ contractName: "Vendor" });
  const { writeContractAsync: writeVendorAsync } = useScaffoldWriteContract({ contractName: "Vendor" });
  const { writeContractAsync: writeLumenAsync } = useScaffoldWriteContract({ contractName: "Lumen" });

  const { data: vendorTokenBalance } = useScaffoldReadContract({
    contractName: "Lumen",
    functionName: "balanceOf",
    args: [vendorContractData?.address],
  });

  const { data: vendorEthBalance } = useWatchBalance({ address: vendorContractData?.address });

  const { data: tokensPerEth } = useScaffoldReadContract({
    contractName: "Vendor",
    functionName: "tokensPerEth",
  });

  return (
    <>
      <div className="page-shell vendor-page flex flex-col flex-grow">
        <header className="page-heading">
          <span className="eyebrow">YOUR ONCHAIN EXCHANGE</span>
          <h1>
            Token Vendor<span className="text-primary">.</span>
          </h1>
          <p>Manage your Lumen tokens, directly from your wallet.</p>
        </header>
        <div className="vendor-balance panel flex flex-col p-8 w-full">
          <div className="eyebrow mb-4">WALLET BALANCE</div>
          <div className="text-lg">
            Your token balance:{" "}
            <div className="inline-flex items-center justify-center tabular-nums">
              {parseFloat(formatEther(lumenBalance || 0n)).toFixed(4)}
              <span className="font-bold ml-1">{lumenSymbol}</span>
            </div>
          </div>
          {/* Vendor Balances */}
          <hr className="w-full border-secondary my-3" />
          <div>
            Vendor token balance:{" "}
            <div className="inline-flex items-center justify-center tabular-nums">
              {Number(formatEther(vendorTokenBalance || 0n)).toFixed(4)}
              <span className="font-bold ml-1">{lumenSymbol}</span>
            </div>
          </div>
          <div>
            Vendor eth balance: {Number(formatEther(vendorEthBalance?.value || 0n)).toFixed(4)}
            <span className="font-bold ml-1">ETH</span>
          </div>
        </div>

        {!address && (
          <div className="panel p-8 mt-6">
            <h2 className="text-xl">Your wallet is the starting point.</h2>
            <p className="muted mb-0">Connect your wallet using the button above to view your token balance.</p>
          </div>
        )}
        {address && !lumenBalance && (
          <div className="panel p-8 mt-6">
            <h2 className="text-xl">Your Lumen balance will appear here.</h2>
            <p className="muted mb-0">Once you hold tokens, you can transfer them to another wallet.</p>
          </div>
        )}

        {/* Buy Tokens */}
        <div className="panel flex flex-col space-y-4 p-6 sm:p-8 mt-6 w-full">
          <div className="text-xl">Buy tokens</div>
          <div>{tokensPerEth?.toString() || 0} tokens per ETH</div>

          <div className="w-full flex flex-col space-y-2">
            <IntegerInput
              placeholder="amount of tokens to buy"
              value={tokensToBuy.toString()}
              onChange={value => setTokensToBuy(value)}
              disableMultiplyBy1e18
            />
          </div>

          <button
            className="btn btn-secondary mt-2"
            onClick={async () => {
              try {
                await writeVendorAsync({ functionName: "buyTokens", value: getTokenPrice(tokensToBuy, tokensPerEth) });
              } catch (err) {
                console.error("Error calling buyTokens function", err);
              }
            }}
          >
            Buy Tokens
          </button>
        </div>

        {!!lumenBalance && (
          <div className="panel flex flex-col space-y-4 p-6 sm:p-8 mt-6 w-full">
            <div>
              <h2 className="text-2xl">Transfer tokens</h2>
              <p className="muted text-sm">Send Lumen to another Ethereum wallet.</p>
            </div>
            <div className="w-full flex flex-col space-y-2">
              <AddressInput placeholder="to address" value={toAddress} onChange={value => setToAddress(value)} />
              <IntegerInput
                placeholder="amount of tokens to send"
                value={tokensToSend}
                onChange={value => setTokensToSend(value as string)}
                disableMultiplyBy1e18
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await writeLumenAsync({
                    functionName: "transfer",
                    args: [toAddress, multiplyTo1e18(tokensToSend)],
                  });
                } catch (err) {
                  console.error("Error calling transfer function", err);
                }
              }}
            >
              Send Tokens
            </button>
          </div>
        )}

        {/* Sell Tokens */}
        {/* {!!lumenBalance && (
          <div className="panel flex flex-col space-y-4 p-6 sm:p-8 mt-6 w-full">
            <div className="text-xl">Sell tokens</div>
            <div>{tokensPerEth?.toString() || 0} tokens per ETH</div>

            <div className="w-full flex flex-col space-y-2">
              <IntegerInput
                placeholder="amount of tokens to sell"
                value={tokensToSell}
                onChange={value => setTokensToSell(value as string)}
                disabled={isApproved}
                disableMultiplyBy1e18
              />
            </div>

            <div className="flex gap-4">
              <button
                className={`btn ${isApproved ? "btn-disabled" : "btn-secondary"}`}
                onClick={async () => {
                  try {
                    await writeLumenAsync({
                      functionName: "approve",
                      args: [vendorContractData?.address, multiplyTo1e18(tokensToSell)],
                    });
                    setIsApproved(true);
                  } catch (err) {
                    console.error("Error calling approve function", err);
                  }
                }}
              >
                Approve Tokens
              </button>

              <button
                className={`btn ${isApproved ? "btn-secondary" : "btn-disabled"}`}
                onClick={async () => {
                  try {
                    await writeVendorAsync({ functionName: "sellTokens", args: [multiplyTo1e18(tokensToSell)] });
                    setIsApproved(false);
                  } catch (err) {
                    console.error("Error calling sellTokens function", err);
                  }
                }}
              >
                Sell Tokens
              </button>
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

export default TokenVendor;

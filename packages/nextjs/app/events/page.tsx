"use client";

import { useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const formatTransactionTime = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const timezoneOffset = `UTC${offset >= 0 ? "+" : "-"}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${timezoneOffset}`;
};

const Events: NextPage = () => {
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // BuyTokens Events
  const { data: buyTokenEvents, isLoading: isBuyEventsLoading } = useScaffoldEventHistory({
    contractName: "Vendor",
    eventName: "BuyTokens",
    blockData: true,
  });

  // // SellTokens Events
  // const { data: sellTokenEvents, isLoading: isSellEventsLoading } = useScaffoldEventHistory({
  //   contractName: "Vendor",
  //   eventName: "SellTokens",
  //   blockData: true,
  // });

  return (
    <div className="page-shell events-page flex flex-col flex-grow">
      <header className="page-heading">
        <span className="eyebrow">ONCHAIN ACTIVITY</span>
        <h1>
          Exchange activity<span className="text-primary">.</span>
        </h1>
        <p>Every token purchase, recorded onchain.</p>
      </header>
      {/* BuyTokens Events */}
      <div>
        <div className="mb-5">
          <span className="block text-2xl font-bold">Buy Token Events</span>
        </div>
        {isBuyEventsLoading ? (
          <div className="flex justify-center items-center mt-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="bg-base-100">Buyer</th>
                  <th className="bg-base-100">Amount of Tokens</th>
                  <th className="bg-base-100">Amount of ETH</th>
                  <th className="bg-base-100 whitespace-nowrap">Transaction time{timeZone ? ` (${timeZone})` : ""}</th>
                </tr>
              </thead>
              <tbody>
                {!buyTokenEvents || buyTokenEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 muted">
                      No purchases yet. Token purchases will appear here.
                    </td>
                  </tr>
                ) : (
                  buyTokenEvents?.map((event, index) => {
                    return (
                      <tr key={index}>
                        <td className="text-center">
                          <Address address={event.args?.buyer} />
                        </td>
                        <td>{formatEther(event.args?.amountOfTokens || 0n)}</td>
                        <td>{formatEther(event.args?.amountOfETH || 0n)}</td>
                        <td className="whitespace-nowrap tabular-nums">
                          {timeZone && event.blockData ? (
                            <time dateTime={new Date(Number(event.blockData.timestamp) * 1000).toISOString()}>
                              {formatTransactionTime(event.blockData.timestamp)}
                            </time>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SellTokens Events */}
      {/* <div className="mt-14">
        <div className="text-center mb-4">
          <span className="block text-2xl font-bold">Sell Token Events</span>
        </div>
        {isSellEventsLoading ? (
          <div className="flex justify-center items-center mt-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="bg-base-100">Seller</th>
                  <th className="bg-base-100">Amount of Tokens</th>
                  <th className="bg-base-100">Amount of ETH</th>
                  <th className="bg-base-100 whitespace-nowrap">Transaction time{timeZone ? ` (${timeZone})` : ""}</th>
                </tr>
              </thead>
              <tbody>
                {!sellTokenEvents || sellTokenEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 muted">
                      No purchases yet. Token purchases will appear here.
                    </td>
                  </tr>
                ) : (
                  sellTokenEvents?.map((event, index) => {
                    return (
                      <tr key={index}>
                        <td className="text-center">
                          <Address address={event.args.seller} />
                        </td>
                        <td>{formatEther(event.args?.amountOfTokens || 0n)}</td>
                        <td>{formatEther(event.args?.amountOfETH || 0n)}</td>
                        <td className="whitespace-nowrap tabular-nums">
                          {timeZone && event.blockData ? (
                            <time dateTime={new Date(Number(event.blockData.timestamp) * 1000).toISOString()}>
                              {formatTransactionTime(event.blockData.timestamp)}
                            </time>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div> */}
    </div>
  );
};

export default Events;

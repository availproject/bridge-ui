/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { badgeVariants } from "../../ui/badge";
import { IoMdClose } from "react-icons/io";
import { Button } from "../../ui/button";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { Logger } from "@/utils/logger";

export default function Eth() {
  const { address, isConnected, connector } = useAccount();

  const handleClick = (
    e: React.MouseEvent,
    callback: VoidFunction | undefined
  ) => {
    e.preventDefault();
    e.stopPropagation();
    callback && callback();
  };

  useEffect(() => {
    Logger.info(`ETH_WALLET_CONNECTED: ${address} ${connector?.name}`);
  }, [isConnected]);

  return (
    <>
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress, ensName, address }) => {
          if (isConnected) {
            return (
              <div className={badgeVariants({ variant: "avail" })}>
                <img src="/images/Wallet.png" className="pr-1" alt="a"></img>
                {ensName ?? truncatedAddress}
                <button onClick={(e) => handleClick(e, show)} className="ml-2">
                  {" "}
                  <IoMdClose />
                </button>
              </div>
            );
          }

          return (
            <Button
              onClick={(e) => handleClick(e, show)}
              variant={"primary"}
              size={"sm"}
            >
              Connect Wallet
            </Button>
          );
        }}
      </ConnectKitButton.Custom>
    </>
  );
}
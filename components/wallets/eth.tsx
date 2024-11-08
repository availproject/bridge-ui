/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Badge, badgeVariants } from "../ui/badge";
import { IoMdClose } from "react-icons/io";
import { Button } from "../ui/button";
import useTransactions from "@/hooks/useTransactions";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

export default function Eth() {
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { fetchTransactions } = useTransactions();

  useEffect(() => {
    fetchTransactions({
      availAddress: selected?.address,
      ethAddress: address,
    });
  }, [address]);

  const handleClick = (e : React.MouseEvent, callback: VoidFunction | undefined ) => {
    e.preventDefault();
    e.stopPropagation();
    callback && callback();
  };

  return (
    <>
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress, ensName }) => {
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
            <Button onClick={(e) => handleClick(e, show)} variant={"primary"} size={"sm"}>
              Connect Wallet
            </Button>
          );
        }}
      </ConnectKitButton.Custom>
    </>
  );
}

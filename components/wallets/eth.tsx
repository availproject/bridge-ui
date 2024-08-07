/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Badge, badgeVariants } from "../ui/badge";
import { IoMdClose } from "react-icons/io";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "../ui/button";
import useTransactions from "@/hooks/useTransactions";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export default function Eth() {
  const { selected } = useAvailAccount();
  const { address } = useAccount();
  const { fetchTransactions } = useTransactions();

  useEffect(()=> {
    fetchTransactions({
      availAddress: selected?.address,
      ethAddress: address,
    })

  },[address])

  return (
    <>
      <div className="">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated");
              
            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        onClick={async()=>{
                          openConnectModal()
                        }}
                        className=""
                        variant={"primary"}
                        size={"sm"}
                        type="button"
                      >
                        Connect Eth Wallet
                      </Button>
                    );
                  }
                  if (chain.unsupported) {
                    return (
                      <button onClick={openChainModal} type="button">
                        <Badge>Wrong network</Badge>
                      </button>
                    );
                  }

                  return (
                      <div className={badgeVariants({ variant: "avail" })}>
                      <img src="/images/Wallet.png" className="pr-1" alt="a"></img>
                        {account?.address?.slice(0, 6) +
                          "..." +
                          account?.address?.slice(-4)}
                        <button
                          onClick={() => {
                            openAccountModal();
                          }}
                          className="ml-2"
                        >
                          {" "}
                          <IoMdClose />
                        </button>
                      </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </>
  );
}

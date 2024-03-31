"use client";

/* eslint-disable @next/next/no-img-element */
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { LoadingButton } from "../ui/loadingbutton";
import { toast } from "../ui/use-toast";
import { IoMdClose } from "react-icons/io";
import { badgeVariants } from "../ui/badge";

//tldr: input fields have a select network dropdown, if avail, the avail connect button shows up, if not, eth, then balances are shown accordingly, the to contains the amount field, or address feild, 

export const CustomEthWalletButton = () => {
  const [loading, setLoading] = useState(false);

  return (
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
          (!authenticationStatus || authenticationStatus === "authenticated");
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
                    onClick={openConnectModal}
                    className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl p-4 !h-20 w-full"
                    size={"sm"}
                    type="button"
                  >
                    Connect Ethereum Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button">
                    Wrong network
                  </button>
                );
              }
              return (
                <>
                  <>
                  <div className="flex flex-row items-center justify-between p-4">
                <p className="subheading">Eth:</p>
                  <div className={badgeVariants({ variant: "default" })}>
                      {account?.address?.slice(0, 6) +
                        "..." +
                        account?.address?.slice(-4)}
                      <button onClick={openAccountModal} className="ml-2">
                        {" "}
                        <IoMdClose />
                      </button>
                    </div>
                    </div>
                  </>
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { badgeVariants } from "../ui/badge";
import { IoMdClose } from "react-icons/io";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "../ui/button";

export default function Eth() {
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
                        onClick={openConnectModal}
                        className=""
                        variant={"primary"}
                        size={"sm"}
                        type="button"
                      >
                        Connect Wallet
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
                      <div className={badgeVariants({ variant: "avail" })}>
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
                    </>
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

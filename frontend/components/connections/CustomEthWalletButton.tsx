"use client";

/* eslint-disable @next/next/no-img-element */
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { LoadingButton } from "../ui/loadingbutton";
import { toast } from "../ui/use-toast";

export const CustomEthWalletButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>(`Sign Message`);
  const [recoveredAddress, setRecoveredAddress] = useState<string>();
  const {
    data: signMessageData,
    error,
    isPending,
    signMessage,
    variables,
    isSuccess,
  } = useSignMessage();

  useEffect(() => {
    (async () => {
      if (variables?.message && signMessageData) {
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature: signMessageData,
        });
        setRecoveredAddress(recoveredAddress);
      }
    })();
  }, [signMessageData, variables?.message]);

  const onSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    setMessage("Signing Message");
    const m = "adfsdd";
    signMessage({ message: m });
  };

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
                    className=""
                    variant={"primary"}
                    size={"lg"}
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
              if (error) {
                setLoading(false);
                setMessage("Sign Message");
                toast({
                  title: `${error.message}`,
                  description: "Friday, February 10, 2023 at 5:57 PM",
                });
                return (
                  <div>
                    <form
                      onSubmit={onSubmit}
                    >
                      <LoadingButton
                        variant={"primary"}
                        size={"lg"}
                        className=" font-thin"
                        loading={loading}
                      >
                        {message}
                      </LoadingButton>
                    </form>
                  </div>
                );
              }

              if (isSuccess) {
                setLoading(false);
                setMessage("Claimed");
                return (
                  <h1 className="text-2xl font-thicccboibold text-white">
                    Claimed
                  </h1>
                );
              }
              return (
                <>
                  <>
                    <div>
                      <form
                        onSubmit={onSubmit}
                      >
                        <LoadingButton
                          variant={"primary"}
                          size={"lg"}
                          className="!font-md"
                          loading={loading}
                        >
                          {message}
                        </LoadingButton>
                      </form>
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

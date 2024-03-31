/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { badgeVariants } from "../ui/badge";
import { IoIosInformationCircleOutline, IoMdClose } from "react-icons/io";
import { useAccountModal } from "@rainbow-me/rainbowkit";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { LoadingButton } from "../ui/loadingbutton";
import { toast } from "../ui/use-toast";
import { useCookies } from "react-cookie";
import { useAccount } from "wagmi";
interface Props {
  claimAddress: string | undefined;
}

export default function Eth (props: Props) {
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState<Number>(0);
  const [refresh, setRefresh] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const account = useAccount();
  const [message, setMessage] = useState<string>(`Sign Message`);
  const { openAccountModal } = useAccountModal();
  const [rewardMessage, setRewardMessage] = useState<string>();
  const {
    data: signMessageData,
    error,
    signMessage,
    isSuccess,
  } = useSignMessage();
  const [cookie, setCookie, removeCookie] = useCookies([
    "ethereumSignature",
    "ethereumTimestamp",
  ]);

  useEffect(() => {
    removeCookie("ethereumSignature");
    removeCookie("ethereumTimestamp");
  }, []);

  useEffect(() => {
    setCookie("ethereumSignature", JSON.stringify(signMessageData), {
      path: "/",
      maxAge: 3600,
      sameSite: true,
    });
    const currentTimestamp = Date.now();
    setCookie("ethereumTimestamp", JSON.stringify(timestamp), {
      path: "/",
      maxAge: 3600,
      sameSite: true,
    });
  }, [signMessageData]);



  const onSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    setMessage("Signing Message");
    const currentTimestamp = parseInt((Date.now() / 1000).toString());
    setTimestamp(currentTimestamp);
    const msg = `Greetings from Avail!\n\nSign this message to check your eligibility. This signature will not cost you any fees.\n\nTimestamp: ${currentTimestamp}`;
    signMessage({ message: msg });
  };
  return (
    <>

              {account && openAccountModal ? (
                <>
                  <div className={badgeVariants({ variant: "avail" })}>
                    {account?.address?.slice(0, 6) +
                      "..." +
                      account?.address?.slice(-4)}
                    <button
                      onClick={() => {
                        removeCookie("ethereumSignature");
                        removeCookie("ethereumTimestamp");
                        openAccountModal();
                      }}
                      className="ml-2"
                    >
                      {" "}
                      <IoMdClose />
                    </button>
                  </div>
                </>
              ) : (
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
                      if (
                        error &&
                        !cookie.ethereumSignature &&
                        !cookie.ethereumTimestamp
                      ) {
                        setLoading(false);
                        setRefresh(true);
                        setMessage("Sign Message");
                        toast({
                          title: `${error.message}`,
                        });
                        return (
                          <div>
                            <form onSubmit={onSubmit}>
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

                      return (
                        <>
                          <>
                            <div>
                              <form onSubmit={onSubmit}>
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
          </div>
              )}

        
       
    </>
  );
}

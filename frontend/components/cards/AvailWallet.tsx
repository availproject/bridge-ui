/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getWallets } from "@talismn/connect-wallets";
import { useCookies } from "react-cookie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IoMdClose } from "react-icons/io";
import { badgeVariants } from "../ui/badge";
import { getSignature } from "@/lib/utils";
import { ClaimRepository } from "@/repository/claim.repository";
import { ClaimType, RewardData } from "@/@types/types";
import { LoadingButton } from "../ui/loadingbutton";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

export default function AvailWallet() {
  // FIX: why do i need to double click to connect a wallet?

  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [rewards, setRewards] = useState<RewardData>();
  const [rewardMessage, setRewardMessage] = useState<string>();
  const [cookie, setCookie, removeCookie] = useCookies([
    "substrateSignature",
    "substrateTimestamp",
  ]);
  const [connected, setConnected] = useState(false);
  const [supportedWallets, setSupportedWallets] = useState<any[]>([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enabledAccounts, setEnabledAccounts] = useState<any[]>([]);

  useEffect(() => {
    //@ts-ignore
    setSupportedWallets(getWallets());
    if (enabledAccounts.length > 0) {
      setOpen(false);
    }
  }, [enabledAccounts.length]);

  useEffect(() => {
    removeCookie("substrateSignature");
    removeCookie("substrateTimestamp");
  }, []);

  useEffect(() => {
    (async () => {
      if (connected && cookie.substrateSignature && cookie.substrateTimestamp) {
        const fetchedData = await ClaimRepository.checkRewards(
          enabledAccounts[0]?.address,
          ClaimType.SUBSTRATE,
          cookie.substrateSignature,
          cookie.substrateTimestamp
        );
        setRewards(fetchedData.rewardData);
        setRewardMessage(fetchedData.rewardData.message);
        if (fetchedData.rewardData.message == "already_claimed") {
        setDisabled(true);
        }
      }
    })();
  }, [
    cookie.substrateSignature,
    cookie.substrateTimestamp,
    enabledAccounts[0],
  ]);

  return (
    <>
      <div className="card_background">
        <section className="card_background flex md:flex-row flex-col justify-between items-center md:p-2 p-0 lg:space-x-5 ">
          <div className="flex flex-col space-y-2 m-3 lg:m-3 py-2">
            <span className="flex flex-row space-x-3 items-center ">
              <h3 className="!font-thicccboibold text-3xl text-white  ">
                Avail Wallet
              </h3>
              {connected ? (
                <>
                  <div className={badgeVariants({ variant: "default" })}>
                    {enabledAccounts[0].address.slice(0, 6) +
                      "..." +
                      enabledAccounts[0]?.address?.slice(-4)}
                    <button
                      className="ml-2"
                      onClick={() => {
                        setConnected(false);
                        removeCookie("substrateSignature");
                        removeCookie("substrateTimestamp");
                        enabledAccounts.pop();
                        setRewards(undefined);
                      }}
                    >
                      <IoMdClose />
                    </button>
                  </div>
                </>
              ) : (
                <></>
              )}
            </span>
            <p className="font-ppmori text-lg text-white text-opacity-65 w-[80%]">
              Connect your Avail address from which you have participated in
              Clash of Nodes.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            {rewards && connected ? (
              <div className="flex w-[30%] flex-row items-center justify-end">
                {rewards?.data?.amount ? (
                  <>
                    <h1 className="xl:text-2xl text-xl font-thicccboibold text-white pr-3">
                      {rewards?.data?.amount} AVL
                    </h1>
                    <div className="px-4 text-white font-bold">|</div>
                    <LoadingButton
                      variant={"primary"}
                      disabled={disabled}
                      onClick={async () => {
                        try {
                          const fetchedData =
                            await ClaimRepository.claimRewards(
                              enabledAccounts[0]?.address,
                              ClaimType.SUBSTRATE,
                              cookie.substrateSignature,
                              cookie.substrateTimestamp,
                              enabledAccounts[0]?.address
                            );
                          setRewardMessage(fetchedData.claimData.message);
                          toast({
                            title: `${fetchedData.claimData.message}`,
                          });
                          setDisabled(true);
                        } catch (e) {
                          toast({
                            title: `${e}`,
                          });
                        }
                      }}
                      className="mr-6"
                      loading={false}
                    >
                      {rewardMessage}
                    </LoadingButton>
                  </>
                ) : (
                  <>
                    <h1 className="xl:text-2xl text-xl font-thicccboibold text-white mr-6">
                      {rewards.message}
                    </h1>
                  </>
                )}
                {/* //TODO: handle an error in which the api fails to fetch for whatever reason */}
              </div>
            ) : (
              <>
                {connected ? (
                  <>
                    <LoadingButton
                      variant={"primary"}
                      size={"lg"}
                      className="!mr-10"
                      loading={loading}
                      onClick={async () => {
                        setLoading(true);
                        const signedMessage = await getSignature(
                          enabledAccounts[0]!
                        );
                        setCookie(
                          "substrateSignature",
                          JSON.stringify(signedMessage?.signature),
                          {
                            path: "/",
                            maxAge: 3600,
                            sameSite: true,
                          }
                        );
                        setCookie(
                          "substrateTimestamp",
                          signedMessage?.timestamp,
                          {
                            path: "/",
                            maxAge: 3600,
                            sameSite: true,
                          }
                        );
                        setLoading(false);
                      }}
                    >
                      Sign Message
                    </LoadingButton>
                  </>
                ) : (
                  <>
                    <DialogTrigger asChild>
                      <Button
                        variant={"primary"}
                        size={"lg"}
                        className="!mr-10"
                      >
                        Connect Wallet
                      </Button>
                    </DialogTrigger>
                  </>
                )}
              </>
            )}

            <DialogContent className="sm:max-w-[425px] bg-[#252831] border-2 border-[#3a3b3cb1] rounded-xl   ">
              <DialogHeader>
                <DialogTitle className="font-thicccboibold text-3xl text-white">
                  Connect And Sign
                </DialogTitle>
                <DialogDescription className="font-thicccboiregular text-md text-white text-opacity-70">
                  This is is some review plus a blue link that helps you get a
                  avail wallet
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-4 h-64 overflow-scroll">
                {supportedWallets.map((wallet) => {
                  return (
                    <Button
                      variant={"default"}
                      disabled={!wallet.installed}
                      className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl p-4 !h-20"
                      onClick={async () => {
                        setSelected(wallet.title);
                        const selectedWallet = supportedWallets.find(
                          (wallet) => wallet.title === selected
                        );
                        if (selectedWallet) {
                          await selectedWallet.enable("rewards").then(() => {
                            selectedWallet.subscribeAccounts(
                              (accounts: any) => {
                                setEnabledAccounts(
                                  accounts.filter((account: any) => {
                                    return account.address.slice(0, 2) != "0x";
                                  })
                                  //TODO: store in session, enabled account so even if refreshed the account still stays connected
                                );
                                setConnected(true);
                              }
                            );
                          });
                        }
                      }}
                      key={wallet.title}
                    >
                      <div>
                        <div className="flex flex-row">
                          <Image
                            alt={wallet.title}
                            height={20}
                            width={20}
                            src={wallet.logo.src}
                            className="mr-4"
                          />
                          {wallet.title}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              <DialogFooter className="flex w-full mt-2 text-white text-opacity-70 font-ppmori font-light flex-col !items-center !justify-center">
                <p>Scroll to find more wallets</p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </>
  );
}

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
import { getSignature } from "@/lib/utils";
import { toast } from "./ui/use-toast";
import { LoadingButton } from "./ui/loadingbutton";
import { Button } from "./ui/button";
import { badgeVariants } from "./ui/badge";
import { CustomEthWalletButton } from "./connections/CustomEthWalletButton";

export default function WalletConnect() {
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <>
          <>
            <DialogTrigger asChild>
              <Button variant={"primary"} size={"lg"} className="!mr-10">
                Connect Wallet
              </Button>
            </DialogTrigger>
          </>
        </>

        <DialogContent className="sm:max-w-[425px] bg-[#252831] border-2 border-[#3a3b3cb1] rounded-xl   ">
          <DialogHeader>
            <DialogTitle className="font-thicccboibold text-3xl text-white">
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="font-thicccboiregular text-md text-white text-opacity-70">
              Connect Your Ethereum and Avail Wallet
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4 max-h-64 overflow-scroll">
            <CustomEthWalletButton />
            {connected ? (
              <>
                <div className="flex flex-row items-center justify-between p-4">
                <p className="subheading">Avail:</p>
                  <div className={badgeVariants({ variant: "default" })}>
                    {enabledAccounts[0].address.slice(0, 6) +
                      "..." +
                      enabledAccounts[0]?.address?.slice(-4)}
                    <button
                      className="ml-2"
                      onClick={() => {
                        setConnected(false);
                        enabledAccounts.pop();
                      }}
                    >
                      <IoMdClose />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          <DialogFooter className="flex w-full mt-2 text-white text-opacity-70 font-ppmori font-light flex-col !items-center !justify-center">
            <p>Scroll to find more wallets</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

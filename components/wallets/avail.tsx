"use client"

/* eslint-disable react/jsx-key */
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { getWallets, Wallet, WalletAccount } from "@talismn/connect-wallets";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { badgeVariants } from "../ui/badge";
import { useCookies } from "react-cookie";
import { ArrowDownCircle, ArrowLeft, InfoIcon } from "lucide-react";
import { useAvailAccount } from "@/stores/availWalletHook";

export default function Avail() {
  const [open, setOpen] = useState(false);
  const [cookie, setCookie, removeCookie] = useCookies([
    "substrateAddress",
    "substrateWallet",
  ]);
  const [supportedWallets, setSupportedWallets] = useState<Wallet[]>([]);
const {selected, setSelected, selectedWallet, setSelectedWallet } = useAvailAccount();
  const [enabledAccounts, setEnabledAccounts] = useState<WalletAccount[]>([]);

  useEffect(() => {(async()=>{
    setSupportedWallets(getWallets());
    if (cookie.substrateAddress && cookie.substrateWallet) {
      const selectedWallet = getWallets().find((wallet) => {
        return wallet.title == cookie.substrateWallet;
      });

      if (!selectedWallet) {
        return;
      }
      //TODO: fix this ts error later
      //@ts-ignore
      selectedWallet.enable("bridge-ui").then(() => {
        selectedWallet.getAccounts().then((accounts) => {
          // Now you can work with the enabledAccounts
          console.log(accounts, "accounts")
          const enabledAccounts = accounts.filter(account =>{
            //@ts-ignore WalletAccount object dosen't have the types right
            return account.type! !== "ethereum"
          });
          console.log(enabledAccounts, "enabled accounts")
          const selected = enabledAccounts.find(
            (account) => account.address == cookie.substrateAddress
          );

          if (!selected) {
            return;
          }

          setSelectedWallet(selectedWallet);
          setEnabledAccounts(enabledAccounts);
          setSelected(selected);

          return null;
        });
      });
    }
  })();
    
  }, [cookie.substrateAddress, cookie.substrateWallet, setSelected, setSelectedWallet]);

  async function updateEnabledAccounts(wallet: Wallet): Promise<undefined> {
    const accounts = await wallet.getAccounts();
    const substrateAccounts = accounts.filter(account =>{
      //@ts-ignore WalletAccount object dosen't have the types right
      return account.type! !== "ethereum"
    });
    setEnabledAccounts(substrateAccounts);
    return;
  }

  function DisconnectWallet() {
    if (!selected) {
      return <></>;
    }
    return (
      <>
        <div
          className={badgeVariants({ variant: "avail" })}
          onClick={() => {
            navigator.clipboard.writeText(selected.address);
          }}
        >
          <img src="/images/Wallet.png" className="pr-1"></img>
          {selected.address.slice(0, 6) + "..." + selected.address?.slice(-4)}
          <button
            className="ml-2"
            onClick={() => {
              removeCookie("substrateAddress");
              removeCookie("substrateWallet");
              setSelected(null);
            }}
          >
            <IoMdClose />
          </button>
        </div>
      </>
    );


  }

  function SelectAccount() {
    return (
      <>
        <div>
          {selectedWallet && (
            <Button
              variant={"default"}
              className="!text-lg mt-3 w-full font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
              key={selectedWallet.title}
            >
              <div>
                <div className="flex flex-row">
                  <Image
                    alt={selectedWallet.title}
                    height={20}
                    width={20}
                    src={selectedWallet.logo.src}
                    className="mr-4"
                  />
                  {selectedWallet.title}
                </div>
              </div>
            </Button>
          )}
          <p className="text-white my-3 !mt-4 text-opacity-70 font-ppmori font-light text-sm flex flex-row items-center justify-center space-x-2">
            <span>Select Accounts</span><ArrowDownCircle className="h-4 w-4"/>
          </p>

          <div className="flex flex-col gap-2 !max-h-48 overflow-y-scroll overflow-x-hidden ">
            {enabledAccounts.map((account, index) => {
              return (
                <Button
                  onClick={() => {
                    setSelected(account);
                    //do it here once
                    setCookie("substrateAddress", account?.address, {
                      path: "/",
                      sameSite: true,
                    });
                    setCookie("substrateWallet", selectedWallet.title, {
                      path: "/",
                      sameSite: true,
                    });
                    setOpen(false);
                  }}
                  className="flex flex-row items-center justify-between bg-[#3a3b3cb1] rounded-xl !h-20  p-4 "
                >
                  <div className="flex flex-row items-center justify-start mx-auto  w-full  ">
                    <div className="text-white  text-opacity-90 space-x-2 !font-thicccboiregular text-md flex flex-row items-center justify-start">
                      <p>{"> "}</p>
                      {account && (
                        <p className="font-thicccboisemibold text-xl cursor-pointer ">
                          {" "}
                          {account.name?.length! > 12
                            ? account.name?.slice(0, 12) + "..."
                            : account.name}
                        </p>
                      )}
                      <p className="text-[#3489E8]">
                        {" "}
                        (
                        {account.address.slice(0, 6) +
                          "..." +
                          account.address.slice(-4)}
                        )
                      </p>
                    </div>
      
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  function SelectWallet() {
    return (
      <>
        <div
          className={`flex flex-col gap-3 ${
            enabledAccounts && enabledAccounts.length > 0 ? "h-0" : "h-64 py-4"
          } overflow-scroll`}
        >
          {supportedWallets
            .sort((a, b) => {
              if (a.title === "SubWallet") return -1;
              if (b.title === "SubWallet") return 1;
              return 0;
            })
            .map((wallet) => {
              return (
                <Button
                  variant={"default"}
                  disabled={!wallet.installed}
                  className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
                  onClick={async () => {
                    setSelectedWallet(wallet);
                    (wallet.enable("rewards") as any).then(async () => {
                      await updateEnabledAccounts(wallet);
                    });

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
      </>
    );
  }

  return (
    window === undefined ? <></> :
    <>
      {selected ? (
        <DisconnectWallet />
      ) : (
        <>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant={"primary"} size={"sm"} className="!ml-2">
                Connect Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#252831] border-2 border-[#3a3b3cb1] rounded-xl   ">
              <DialogHeader className="flex justify-start">
                <DialogTitle className="font-thicccboibold text-3xl text-white flex flex-row items-center space-x-2">
                  {enabledAccounts.length > 0 && (
                    <Button
                      disabled={enabledAccounts.length <= 0}
                      variant={"outline"}
                      className="!bg-[#252831] !border-0 !p-0 "
                      onClick={() => {
                        setEnabledAccounts([]);
                        setSelected(null);
                      }}
                    >
                      <ArrowLeft />
                    </Button>
                  )}
                  <p>Connect Wallet</p>
                </DialogTitle>
                <div className="border-b border-white border-opacity-25 w-full !h-1 pt-2 "></div>
                {enabledAccounts.length <= 0 && (
                  <DialogDescription className="font-thicccboiregular text-md text-white text-opacity-70 pt-2">
                    <div className="flex flex-row font-ppmori items-start justify-start pt-3 space-x-2">
                      <InfoIcon />
                      <span>
                        Don&apos;t have an Avail Wallet yet? Checkout this{" "}
                        <a
                          href="https://docs.availspace.app/avail-space/web-dashboard-user-guide/getting-started/how-to-install-subwallet-and-create-a-new-avail-account?utm_source=avail&utm_medium=docspace&utm_campaign=avlclaim"
                          className=" underline "
                          target="_blank"
                        >
                          cool tutorial
                        </a>{" "}
                        by Subwallet.
                      </span>
                    </div>
                  </DialogDescription>
                )}
                <SelectWallet />
                {enabledAccounts && enabledAccounts.length > 0 && (
                  <SelectAccount />
                )}
              </DialogHeader>
              <DialogFooter className="flex w-full mt-2 text-white text-opacity-70 font-ppmori font-light !flex-col !items-center !justify-center">
                <p>
                  Scroll to find more{" "}
                  {enabledAccounts && enabledAccounts.length > 0
                    ? "accounts"
                    : "wallets"}
                </p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}

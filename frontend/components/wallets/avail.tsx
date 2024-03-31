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
import { getWallets } from "@talismn/connect-wallets";
import Image from "next/image";
import { IoMdClose } from "react-icons/io";
import { badgeVariants } from "../ui/badge";

export default function Avail() {
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
      {connected ? (
        <div className="!mr-2">
          {" "}
          <div className={badgeVariants({ variant: "avail" })}>
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
      ) : (
        <>
          {" "}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant={"primary"} size={"sm"} className="!ml-2">
                Connect Wallet
              </Button>
            </DialogTrigger>
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
                        await wallet.enable("rewards").then(() => {
                          wallet.subscribeAccounts((accounts: any) => {
                            setEnabledAccounts(
                              accounts.filter((account: any) => {
                                return account.address.slice(0, 2) != "0x";
                              })
                            );
                            setConnected(true);
                          });
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
              <DialogFooter className="flex w-full mt-2 text-white text-opacity-70 font-ppmori font-light flex-col !items-center !justify-center">
                <p>Scroll to find more wallets</p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}

"use client";

import { CustomEthWalletButton } from "../connections/CustomEthWalletButton";
import { useAccount } from "wagmi";
import { badgeVariants } from "../ui/badge";
import { IoMdClose } from "react-icons/io";
import { useAccountModal } from "@rainbow-me/rainbowkit";

export default function EthWallet() {
  const account = useAccount();
  const { openAccountModal } = useAccountModal();
  return (
    <>
      <div className="card_background">
        <section className="card_background flex md:flex-row flex-col justify-between items-center md:p-2 p-0 lg:space-x-5 ">
          <div className="flex flex-col space-y-2 m-3 lg:m-3 py-2">
            <span className="flex flex-row space-x-3 items-center ">
              <h3 className="!font-thicccboibold text-3xl text-white  ">
                Ethereum Wallet
              </h3>
              {account && openAccountModal ? (
                  <>
                    <div className={badgeVariants({ variant: "default" })}>
                      {account?.address?.slice(0, 6) +
                        "..." +
                        account?.address?.slice(-4)}
                      <button onClick={openAccountModal} className="ml-2">
                        {" "}
                        <IoMdClose />
                      </button>
                    </div>
                  </>
                ) : (
                  <></>
                )}
            </span>
            <p className="font-ppmori text-lg text-white text-opacity-65 w-[80%]">
              Connect your Ethereum address from which you have participated in
              Clash of Nodes.
            </p>
          </div>
          <div className="pr-6">
            <CustomEthWalletButton />
          </div>
        </section>
      </div>
    </>
  );
}

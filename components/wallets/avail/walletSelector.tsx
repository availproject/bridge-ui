/* eslint-disable @next/next/no-img-element */
import React, { memo, useEffect } from "react";
import Image from "next/image";
import { Wallet } from "@talismn/connect-wallets";
import { Button } from "@/components/ui/button";
import { WalletSelectionProps } from "./types";

export const WalletSelector = memo(
  ({
    supportedWallets,
    onWalletSelect,
    metamaskInstalled,
  }: WalletSelectionProps) => {
    const sortedWallets = React.useMemo(
      () =>
        supportedWallets.sort((a, b) => {
          if (a.title === "SubWallet") return -1;
          if (b.title === "SubWallet") return 1;
          return 0;
        }),
      [supportedWallets],
    );

    return (
      <div className="flex flex-col gap-3 max-h-72 overflow-y-scroll">
        {/* Metamask Snap Button */}
        {/*<Button
        variant="default"
        disabled={!metamaskInstalled}
        className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
        onClick={() => onWalletSelect({ title: 'MetamaskSnap' } as Wallet)}
        key="Metamask"
      >
        <div className="flex flex-row">
          <Image
            alt="Metamask Snap"
            src="/images/availsnap.png"
            width={6}
            height={6}
            className="mr-4 h-6 w-6"
          />
          Avail Snap
        </div>
      </Button>*/}

        {/* Other Wallets */}
        {sortedWallets.map((wallet: Wallet) => (
          <Button
            key={wallet.title}
            variant="default"
            disabled={!wallet.installed}
            className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
            onClick={() => onWalletSelect(wallet)}
          >
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
          </Button>
        ))}
      </div>
    );
  },
);

WalletSelector.displayName = "WalletSelector";

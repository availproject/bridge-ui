import { Wallet } from "@talismn/connect-wallets";
import React, { memo } from "react";
import availSnap from "../../assets/images/availsnap.png";
import { WalletSelectionProps } from "../../types";
import { Button } from "../ui/Button";

const WalletSelector = memo(
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
      [supportedWallets]
    );

    return (
      <div className="flex flex-col gap-3 max-h-72 overflow-y-scroll">
        {/* Metamask Snap Button */}
        <Button
          disabled={!metamaskInstalled}
          className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
          onClick={() => onWalletSelect({ title: "MetamaskSnap" } as Wallet)}
          key="Metamask"
        >
          <div className="flex flex-row">
            <img
              alt="Metamask Snap"
              src={availSnap}
              width="24"
              height="24"
              className="mr-4 h-6 w-6"
            />
            Avail Snap
          </div>
        </Button>

        {/* Other Wallets */}
        {sortedWallets.map((wallet: Wallet) => (
          <Button
            key={wallet.title}
            disabled={!wallet.installed}
            className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
            onClick={() => onWalletSelect(wallet)}
          >
            <div className="flex flex-row">
              <img
                alt={wallet.title}
                height="20"
                width="20"
                src={wallet.logo.src}
                className="mr-4"
              />
              {wallet.title}
            </div>
          </Button>
        ))}
      </div>
    );
  }
);

export default WalletSelector;

import React, { memo } from 'react';
import { WalletSelectionProps } from '../../types';
import { Wallet } from '@talismn/connect-wallets';

export const WalletSelector = memo(({
  supportedWallets, 
  onWalletSelect, 
  metamaskInstalled 
}: WalletSelectionProps) => {
  const sortedWallets = React.useMemo(() => 
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
      <button
        disabled={!metamaskInstalled}
        className="!text-lg font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
        onClick={() => onWalletSelect({ title: 'MetamaskSnap' } as Wallet)}
        key="Metamask"
      >
        <div className="flex flex-row">
          <img
            alt="Metamask Snap"
            src="/images/availsnap.png"
            width="24" 
            height="24"
            className="mr-4 h-6 w-6"
          />
          Avail Snap
        </div>
      </button>

      {/* Other Wallets */}
      {sortedWallets.map((wallet: Wallet) => (
        <button
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
        </button>
      ))}
    </div>
  );
});

WalletSelector.displayName = 'WalletSelector';
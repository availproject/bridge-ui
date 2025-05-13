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
    <div className="aw-flex-col aw-gap-3 aw-max-h-72 aw-overflow-y-scroll">
      {/* Metamask Snap Button */}
      <button
        disabled={!metamaskInstalled}
        className="aw-text-lg aw-font-thin aw-bg-darker aw-text-left aw-rounded-xl aw-p-8 aw-button"
        onClick={() => onWalletSelect({ title: 'MetamaskSnap' } as Wallet)}
        key="Metamask"
      >
        <div className="aw-flex-row">
          <img
            alt="Metamask Snap"
            src="/images/availsnap.png"
            width="24" 
            height="24"
            className="aw-mr-4 aw-h-6 aw-w-6"
          />
          Avail Snap
        </div>
      </button>

      {/* Other Wallets */}
      {sortedWallets.map((wallet: Wallet) => (
        <button
          key={wallet.title}
          disabled={!wallet.installed}
          className="aw-text-lg aw-font-thin aw-bg-darker aw-text-left aw-rounded-xl aw-p-8 aw-button"
          onClick={() => onWalletSelect(wallet)}
        >
          <div className="aw-flex-row">
            <img
              alt={wallet.title}
              height="20"
              width="20"
              src={wallet.logo.src}
              className="aw-mr-4"
            />
            {wallet.title}
          </div>
        </button>
      ))}
    </div>
  );
});

WalletSelector.displayName = 'WalletSelector';
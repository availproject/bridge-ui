/* eslint-disable @next/next/no-img-element */

import { badgeVariants } from '@/components/ui/badge';
import React, { memo } from 'react';
import { IoMdClose } from 'react-icons/io';
import { FaArrowRotateRight } from 'react-icons/fa6';
import { DisconnectWalletProps } from './types';

export const DisconnectWallet = memo(({
  selected, 
  installedSnap, 
  onDisconnect 
}: DisconnectWalletProps) => {
  if (!selected) return null;

  return (
    <div
      className={badgeVariants({ variant: "avail" })}
      onClick={() => {
        navigator.clipboard.writeText(selected.address);
      }}
    >
      <img src="/images/Wallet.png" className="pr-1" alt="wallet" />
      {selected.source === "MetamaskSnap"
        ? installedSnap
          ? selected.address.slice(0, 6) + "..." + selected.address?.slice(-4)
          : "Retry Connecting"
        : selected.address.slice(0, 6) + "..." + selected.address?.slice(-4)}
      
      <button className="ml-2" onClick={onDisconnect}>
        {selected.source === "MetamaskSnap" ? (
          installedSnap ? <IoMdClose /> : <FaArrowRotateRight />
        ) : (
          <IoMdClose />
        )}
      </button>
    </div>
  );
});

DisconnectWallet.displayName = 'DisconnectWallet';
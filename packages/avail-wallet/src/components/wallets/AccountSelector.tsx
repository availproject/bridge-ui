import React, { memo } from 'react';
import { AccountSelectionProps } from '../../types';

export const AccountSelector = memo(({
  selectedWallet, 
  enabledAccounts, 
  onAccountSelect 
}: AccountSelectionProps) => {
  return (
    <>
      <br />
      {selectedWallet && (
        <button
          className="aw-text-lg aw-mt-3 aw-w-full aw-font-thin aw-bg-darker aw-text-left aw-rounded-xl aw-p-8"
        >
          <div className="aw-flex-row">
            <img
              alt={selectedWallet.title}
              height={20}
              width={20}
              src={selectedWallet.logo.src}
              className="aw-mr-4"
            />
            {selectedWallet.title}
          </div>
        </button>
      )}
      
      <p className="aw-text-white aw-my-3 aw-mt-4 aw-text-opacity-70 aw-font-light aw-text-sm aw-flex-row aw-items-center aw-justify-center aw-space-x-2">
        <span>Select Accounts</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aw-h-4 aw-w-4">
          <circle cx="12" cy="12" r="10" />
          <polyline points="8 12 12 16 16 12" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      </p>

      <div className="aw-flex-col aw-gap-2 aw-max-h-48 aw-overflow-y-scroll aw-overflow-x-hidden aw-pt-2">
        {enabledAccounts.map((account, index) => (
          <button
            key={index}
            onClick={() => onAccountSelect(account)}
            className="aw-flex-row aw-items-center aw-justify-between aw-bg-darker aw-rounded-xl aw-h-14 aw-p-4 aw-button"
          >
            <div className="aw-flex-row aw-items-center aw-justify-start aw-mx-auto aw-w-full">
              <div className="aw-text-white aw-text-opacity-90 aw-space-x-2 aw-text-md aw-flex-row aw-items-center aw-justify-start">
                <p>{"> "}</p>
                <p className="aw-font-semibold aw-text-xl aw-cursor-pointer">
                  {account.name?.length! > 12
                    ? account.name?.slice(0, 12) + "..."
                    : account.name}
                </p>
                <p className="aw-text-blue">
                  {" "}
                  (
                  {account.address.slice(0, 6) +
                    "..." +
                    account.address.slice(-4)}
                  )
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
});

AccountSelector.displayName = 'AccountSelector';
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
          className="!text-lg mt-3 w-full font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8"
        >
          <div className="flex flex-row">
            <img
              alt={selectedWallet.title}
              height={20}
              width={20}
              src={selectedWallet.logo.src}
              className="mr-4"
            />
            {selectedWallet.title}
          </div>
        </button>
      )}
      
      <p className="text-white my-3 !mt-4 text-opacity-70 font-ppmori font-light text-sm flex flex-row items-center justify-center space-x-2">
        <span>Select Accounts</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="12" cy="12" r="10" />
          <polyline points="8 12 12 16 16 12" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      </p>

      <div className="flex flex-col gap-2 !max-h-48 overflow-y-scroll overflow-x-hidden pt-2">
        {enabledAccounts.map((account, index) => (
          <button
            key={index}
            onClick={() => onAccountSelect(account)}
            className="flex flex-row items-center justify-between bg-[#3a3b3cb1] rounded-xl !h-14 p-4"
          >
            <div className="flex flex-row items-center justify-start mx-auto w-full">
              <div className="text-white text-opacity-90 space-x-2 !font-thicccboiregular text-md flex flex-row items-center justify-start">
                <p>{"> "}</p>
                <p className="font-thicccboisemibold text-xl cursor-pointer">
                  {account.name?.length! > 12
                    ? account.name?.slice(0, 12) + "..."
                    : account.name}
                </p>
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
          </button>
        ))}
      </div>
    </>
  );
});

AccountSelector.displayName = 'AccountSelector';
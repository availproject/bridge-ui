'use client'

import { useState, ChangeEvent } from 'react';
import { Chain, CheckedState } from "@/types/common";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { InfoIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { validAddress } from '@/utils/common';
import { showFailedMessage, showSuccessMessage } from '@/utils/toasts';

interface AddressDialogProps {
  setToAddress: (address: string) => void;
  toChain: Chain;
}

export default function AddressDialog({ setToAddress, toChain }: AddressDialogProps) {
  const [open, setOpen] = useState(false);
  const [isChecked, setIsChecked] = useState<CheckedState>(false);
  const [address, setAddress] = useState('');
  const [error, setError] = useState(false);

  function handleAddressChange(e: ChangeEvent<HTMLInputElement>) {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setError(!validAddress(newAddress, toChain));
  }

  function handleAddAddress() {
    if (validAddress(address, toChain)) {
      setToAddress(address);
      setOpen(false);
      showSuccessMessage({
        title: "Address Added",
        desc: "The address has been added successfully and would be used for future transactions",
      });
    } else {
      showFailedMessage({
        title: "Invalid Address",
        description: "Check the address you have entered",
      });
    }
  }

  return (
    <div className="flex flex-row items-center justify-between">
      <AlertDialog open={open}>
        <AlertDialogTrigger
          onClick={() => {
            setOpen(!open);
          }}
          className=" "
        >
          <div className="flex flex-row items-center text-sm underline-offset-2 underline  text-white justify-start pl-1 font-ppmori text-opacity-80 pt-2">
            <InfoIcon className="w-3 h-3 mr-1" />
            Send to a different address?
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#252831] border-2 border-[#3a3b3cb1] !rounded-[1rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-ppmoribsemibold !text-lg">
            Send to a different address
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#B6B7BB] font-thicccboisemibold text-md">
              <div className={`!mt-3 card_background !bg-[#25283163] pl-2 !rounded-xl !space-y-2 p-2 flex flex-row items-center justify-between ${error ? '!border-red-500 border-opacity-20 !border' : ''}`}>
                <input
                  className="!bg-inherit w-full  text-white placeholder:text-md p-2 !h-8 border-none !outline-none !bg-none"
                  type="text"
                  placeholder={(() => {
                    switch(toChain) {
                      case Chain.AVAIL:
                        return "Ex 5H6Y7...";
                      case Chain.BASE:
                        return "Ex 0x206Y7...";
                      case Chain.ETH:
                        return "Ex 0x206Y7...";
                      default:
                        return "Ex 0x206Y7...";
                    }
                  })()}
                  value={address}
                  onChange={handleAddressChange}
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-row items-bottom pt-2"></div>
              <div className="items-start flex  space-x-2 px-2 pb-4 pt-1">
                <Checkbox
                  id="terms1"
                  checked={isChecked}
                  onCheckedChange={setIsChecked}
                  className="text-white border-white border-opacity-70 border rounded-md mt-1"
                ></Checkbox>
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms1"
                    className="text-sm space-y-4 font-light leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white text-opacity-60"
                  >
                    <span>
                      Please double-check if the address is
                      correct. Any tokens sent to an
                      incorrect address will be
                      unrecoverable.
                    </span>
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setOpen(false);
              }}
              className="!bg-inherit !border-0 text-[#fa6a65] hover:text-red-800 "
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!isChecked || error || address.length === 0}
              className="rounded-xl bg-[#464A5B] flex flex-row  items-center p-1 px-4 font-ppmoribsemibold text-2xl  justify-center cursor-pointer"
              onClick={handleAddAddress}
            >
              
              <span className="text-sm text-white text-opacity-70">
                Add Address
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


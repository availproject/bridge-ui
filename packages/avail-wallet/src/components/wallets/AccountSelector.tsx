import { ArrowDownCircle } from "lucide-react";
import { memo } from "react";
import { AccountSelectionProps } from "../../types";
import { Button } from "../ui/Button";

const AccountSelector = memo(
  ({
    selectedWallet,
    enabledAccounts,
    onAccountSelect,
  }: AccountSelectionProps) => {
    return (
      <>
        <br />
        {selectedWallet && (
          <Button
            variant="default"
            className="!text-lg mt-3 w-full font-thin bg-[#3a3b3cb1] text-left font-ppmori rounded-xl !p-8 "
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
          </Button>
        )}

        <p className="text-white my-3 !mt-4 text-opacity-70 font-ppmori font-light text-sm flex flex-row items-center justify-center space-x-2">
          <span>Select Accounts</span>
          <ArrowDownCircle className="h-4 w-4" />
        </p>

        <div className="flex flex-col gap-2 !max-h-48 overflow-y-scroll overflow-x-hidden pt-2">
          {enabledAccounts.map((account, index) => (
            <Button
              key={index}
              onClick={() => onAccountSelect(account)}
              className="flex flex-row items-center justify-between bg-[#3a3b3cb1] rounded-xl !h-14 p-4"
            >
              <div className="flex flex-row items-center justify-start mx-auto w-full">
                <div className="text-white text-opacity-90 space-x-2 !font-thicccboiregular text-md flex flex-row items-center justify-start">
                  <p>{"> "}</p>
                  <p className="font-thicccboisemibold text-xl cursor-pointer">
                    {account.name?.length && account.name?.length > 12
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
            </Button>
          ))}
        </div>
      </>
    );
  }
);

export default AccountSelector;

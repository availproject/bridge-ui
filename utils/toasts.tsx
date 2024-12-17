import { toast } from "@/components/ui/use-toast";
import { FaCheckCircle } from "react-icons/fa";
import { ArrowUpRight } from "lucide-react";
import { RxCrossCircled } from "react-icons/rx";
import { Chain } from "@/types/common";

export const showSuccessMessage = ({
    blockhash,
    txHash,
    chain,
    title,
    desc,
  }: {
    blockhash?: `${string}`;
    txHash?: string;
    chain?: Chain;
    title?: string;
    desc?: string;
  }) => {
    toast({
      title: (
        <div className="flex flex-row items-center justify-center !space-x-3 ">
          <FaCheckCircle className="mr-4 h-10 w-10" color="0BDA51" />
          <div className="flex flex-col space-y-2">
            <div className="mr-2 font-thicccboisemibold">
              {title ? title : "Transaction Initiated Successfully"}
            </div>
            <div className="!text-xs !text-white !text-opacity-40 font-thicccboisemibold">
              {desc ? desc : "Your Transaction was Initiated Successfully."}
              {blockhash && <a
                target="_blank"
                className="flex flex-row underline"
                href={
                  chain === Chain.ETH
                    ? `${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL}/tx/${blockhash}`
                    : `${process.env.NEXT_PUBLIC_SUBSCAN_URL}/extrinsic/${txHash}`
                }
              >
                <p>View on Explorer. </p>
                <ArrowUpRight className="h-3 w-6" />
              </a>}
            </div>
          </div>
        </div>
      ),
    });
  };
  
  
  export const showFailedMessage = ({title, description} : {title: string, description?: string}) => {
    toast({
      title: (
        <div className="flex flex-row items-center justify-center !space-x-3 ">
          <RxCrossCircled className="mr-4 h-10 w-10" color="FF0000" />
          <div className="flex flex-col space-y-2">
            <p className="mr-2 font-thicccboisemibold text-white text-opacity-70">
            {title ? title :  "Your Transaction has failed due to some error. Please try again later."} 
            </p>
          </div>
        </div>
      ),
    });
  };
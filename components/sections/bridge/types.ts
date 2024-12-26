import { Chain } from "@/types/common";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const formSchema = z.object({
  fromAmount: z.preprocess(
    (val) => parseFloat(val as string),
    z.number({
      invalid_type_error: "Amount should be a number",
    })
  ),
  toAddress: z.string(),
});

export type FormSchema = z.infer<typeof formSchema>;

export interface Account {
  address: string;
}

export interface ChainBalance {
  balance: string;
  chain: Chain;
}

export interface BridgeFormProps {
  form: UseFormReturn<FormSchema>;
  fromChain: Chain;
  toChain: Chain;
  setFromChain: (chain: Chain) => void;
  setToChain: (chain: Chain) => void;
  setFromAmount: (amount: number) => void;
  setToAddress: (address: string) => void;
  toAddress: string | undefined;
  selected: Account | null;
  account: Account | null;
}

export interface Account {
    address: string;
  }
  
  export interface ChainBalance {
    balance: string;
    chain: Chain;
  }
  
  export interface BridgeSectionProps {
    fromChain: Chain;
    toChain: Chain;
    setFromChain: (chain: Chain) => void;
    setToChain: (chain: Chain) => void;
    selected: Account | null;
    account: Account | null;
  }
  
  export interface InputState {
    fromAmount: string;
    toAddress: string;
  }

  export const InputStateDefault: InputState = {
    fromAmount: "",
    toAddress: "",
  };
  
  export interface InputError {
    fromAmount?: string;
    toAddress?: string;
  }
  
  export const ChainPairs = {
    ETH_TO_AVAIL: `${Chain.ETH}-${Chain.AVAIL}`,
    AVAIL_TO_ETH: `${Chain.AVAIL}-${Chain.ETH}`,
    BASE_TO_ETH: `${Chain.BASE}-${Chain.ETH}`,
    ETH_TO_BASE: `${Chain.ETH}-${Chain.BASE}`
  } as const;
  
  

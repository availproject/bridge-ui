"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import TransactionSection from "../sections/transactions";
import PendingTxnsBadge from "@/components/common/pendingtxnsbadge";
import BridgeSection from "../sections/bridge";
import { useTransactionsStore } from "@/stores/transactions";
import TransactionModal from "../sections/bridge/review-and-submit";
import { useCommonStore } from "@/stores/common";
import AdvancedSettings from "./settings";
import { validAddress } from "@/utils/common";
import { Chain } from "@/types/common";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import AvailWalletConnect from "../wallets/avail";
import Eth from "../wallets/eth";

const addressSchema = z.object({
  ethAddress: z.string().refine((val) => validAddress(val, Chain.ETH), {
    message: "Invalid ETH address",
  }),
  availAddress: z.string().refine((val) => validAddress(val, Chain.AVAIL), {
    message: "Invalid Avail address",
  }),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function Container() {
  const [activeTab, setActiveTab] = useState("transactions");
  const { fetchAllTransactions, setTransactionLoader } = useTransactionsStore();
  const {
    reviewDialog: { isOpen: isModalOpen, onOpenChange: setIsModalOpen },
  } = useCommonStore();

  const {
    register,
    formState: { errors },
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
  });

  const addresses = watch();

  useEffect(() => {
    // Fetch if either address is valid
    if (
      (addresses.ethAddress && validAddress(addresses.ethAddress, Chain.ETH)) ||
      (addresses.availAddress &&
        validAddress(addresses.availAddress, Chain.AVAIL))
    ) {
      fetchAllTransactions({
        ethAddress: addresses.ethAddress || undefined,
        availAddress: addresses.availAddress || undefined,
        setTransactionLoader,
      });
    }
  }, [addresses.ethAddress, addresses.availAddress]);

  // Polling effect for updates
  useEffect(() => {
    // Start polling if either address is present
    if (!addresses.ethAddress && !addresses.availAddress) return;

    const interval = setInterval(async () => {
      if (
        (addresses.ethAddress &&
          validAddress(addresses.ethAddress, Chain.ETH)) ||
        (addresses.availAddress &&
          validAddress(addresses.availAddress, Chain.AVAIL))
      ) {
        await fetchAllTransactions({
          ethAddress: addresses.ethAddress || undefined,
          availAddress: addresses.availAddress || undefined,
          setTransactionLoader,
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [addresses.ethAddress, addresses.availAddress]);

  return (
    <div className="text-white w-full my-4 flex flex-col space-y-3 items-center justify-center">
      <Tabs
        defaultValue="transactions"
        value={activeTab}
        onValueChange={setActiveTab}
        id="container"
        className="section_bg p-2 w-screen max-sm:rounded-none max-sm:!border-x-0 !max-w-xl"
      >
        <TabsList className="flex flex-row items-center justify-between bg-transparent !border-0 p-2 mb-6 mx-2 mt-2">
          <div className="flex flex-row items-center justify-between">
            <h1 className="font-ppmori items-center flex flex-row space-x-2 text-white text-opacity-80 text-2xl w-full ">
              <span className="relative flex flex-row items-center justify-center">
                <TabsTrigger
                  value="transactions"
                  className="relative font-ppmori text-lg data-[state=active]:bg-transparent data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
                >
                  <p className="data-[state=active]:border-b border-white">
                    Internal Transaction Viewer + Claim Tool
                  </p>
                </TabsTrigger>
              </span>
            </h1>
          </div>
        </TabsList>
        <TabsContent
          id="transactions"
          value="transactions"
          className="text-white h-full"
        >
          <div className="w-full max-w-xl p-4 space-y-4"> <h1 className="text-white text-md font-ppmori">1. Connect Wallets</h1>
          <div className="flex flex-row items-center justify-start gap-4">
            <AvailWalletConnect/>
            <Eth/>
          </div>
            <h1 className="text-white text-md font-ppmori pt-1">2. Enter addresses to claim for</h1>
            <div className="space-y-2">
              <Input
                {...register("ethAddress")}
                placeholder="ETH Address"
                className={`w-full p-2 bg-transparent border !rounded-lg text-white ${
                  errors.ethAddress
                    ? "!border-red-500 focus:!border-red-500"
                    : "border-gray-700 focus:border-blue-500"
                } outline-none [&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:!shadow-none [&:-webkit-autofill]:[transition-delay:9999999s] placeholder:text-gray-400`}
              />
              {errors.ethAddress && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.ethAddress.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                {...register("availAddress")}
                placeholder="Avail Address"
                className={`w-full p-2 bg-transparent border !rounded-lg text-white ${
                  errors.availAddress
                    ? "!border-red-500 focus:!border-red-500"
                    : "border-gray-700 focus:border-blue-500"
                } outline-none [&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:!shadow-none [&:-webkit-autofill]:[transition-delay:9999999s] placeholder:text-gray-400`}
              />
              {errors.availAddress && (
                <p className="!text-red-500 text-sm mt-1">
                  {errors.availAddress.message}
                </p>
              )}
            </div>
            <h1 className="text-white text-md font-ppmori pt-1">3. Pick from the list and claim</h1>
          </div>
          <TransactionSection />
        </TabsContent>
      </Tabs>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

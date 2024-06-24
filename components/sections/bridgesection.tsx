/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HiOutlineSwitchVertical } from "react-icons/hi";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RiLoopLeftFill } from "react-icons/ri";
import { useEffect, useState } from "react";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import {
  _getBalance,
  showFailedMessage,
  showSuccessMessage,
  validAddress,
} from "@/utils/common";
import { useAccount } from "wagmi";
import { useAvailAccount } from "@/stores/availWalletHook";
import { useCommonStore } from "@/stores/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Chain, TransactionStatus } from "@/types/common";
import useBridge from "@/hooks/useBridge";
import { toast } from "@/components/ui/use-toast";
import { parseError } from "@/utils/parseError";
import BigNumber from "bignumber.js";
import { badgeVariants } from "../ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import useTransactions from "@/hooks/useTransactions";
import { parseAmount } from "@/utils/parseAmount";
import { LoadingButton } from "../ui/loadingbutton";
import useTransactionButtonState from "@/hooks/useTransactionButtonState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { RxCrossCircled } from "react-icons/rx";
import TransactionSection from "./transactionsection";
import { FaCheckCircle } from "react-icons/fa";
import { pollWithDelay } from "@/utils/poller";
import { appConfig } from "@/config/default";

const formSchema = z.object({
  fromAmount: z.preprocess(
    //@ts-ignore - preprocess is not in the types
    (a) => parseFloat(z.number().parse(a)),
    z.number({
      invalid_type_error: "Amount should be a number",
    }),
  ),
  toAddress: z.string(),
});
type CheckedState = boolean | "indeterminate";

export default function BridgeSection() {
  const account = useAccount();
  const {
    fromChain,
    setFromChain,
    toChain,
    setToChain,
    setFromAmount,
    setToAddress,
  } = useCommonStore();
  const { selected } = useAvailAccount();
  const { initEthToAvailBridging, initAvailToEthBridging } = useBridge();
  const {
    pendingTransactionsNumber,
    setPendingTransactionsNumber,
    readyToClaimTransactionsNumber,
    setReadyToClaimTransactionsNumber,
  } = useCommonStore();
  const { fetchTransactions } = useTransactions();
  const { pendingTransactions } = useTransactions();
  const [isChecked, setIsChecked] = useState<CheckedState>(false);
  const [open, setOpen] = useState(false);
  const [ethBalance, setEthBalance] = useState<string | undefined | null>(null);
  const [availBalance, setAvailBalance] = useState<string | undefined | null>(
    null,
  );

  const [transactionInProgress, setTransactionInProgress] =
    useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toAddress: "",
    },
  });

  const { buttonStatus, isDisabled, availAmountToDollars } =
    useTransactionButtonState(ethBalance, availBalance, transactionInProgress);

  const appInit = async () => {
    if (!selected && !account.address) return;
    pollWithDelay(
      fetchTransactions,
      [
        {
          availAddress: selected?.address,
          ethAddress: account.address,
        },
      ],
      appConfig.bridgeIndexerPollingInterval,
      () => true,
    );
  };
  useEffect(() => {
    appInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    setPendingTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status !== TransactionStatus.CLAIMED,
      ).length,
    );
    setReadyToClaimTransactionsNumber(
      pendingTransactions.filter(
        (transaction) => transaction.status == TransactionStatus.READY_TO_CLAIM,
      ).length,
    );
  }, [pendingTransactions]);

  useEffect(() => {
    (async () => {
      if (account.address) {
        const result = await _getBalance(Chain.ETH, undefined, account.address);
        setEthBalance(result);
      } else {
        setEthBalance(undefined);
      }
      if (selected?.address) {
        const result = await _getBalance(Chain.AVAIL, selected?.address);
        setAvailBalance(result);
      } else {
        setAvailBalance(undefined);
      }
    })();
  }, [account.address, selected?.address]);

  useEffect(() => {
    document
      .getElementById("transactions")
      ?.setAttribute(
        "style",
        `height:${document.getElementById("bridge")?.clientHeight}px`,
      );
  }, []);

  const resetState = async () => {
    form.reset();
    if (account.address) {
      const result = await _getBalance(Chain.ETH, undefined, account.address);
      setEthBalance(result);
    } else {
      setEthBalance(undefined);
    }
    if (selected?.address) {
      const result = await _getBalance(Chain.AVAIL, selected?.address);
      setAvailBalance(result);
    } else {
      setAvailBalance(undefined);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (fromChain === Chain.ETH) {
        const fromAmountAtomic = new BigNumber(values.fromAmount)
          .multipliedBy(new BigNumber(10).pow(18))
          .toString(10);
        const destinationAddress = selected?.address || values.toAddress;

        setTransactionInProgress(true);
        const a = await initEthToAvailBridging({
          atomicAmount: fromAmountAtomic,
          destinationAddress: destinationAddress,
        });

        showSuccessMessage({
          blockhash: a,
          chain: Chain.ETH,
        });
        setTransactionInProgress(false);

        // reset state
        resetState();
      } else if (fromChain === Chain.AVAIL) {
        const fromAmountAtomic = new BigNumber(values.fromAmount)
          .multipliedBy(new BigNumber(10).pow(18))
          .toString(10);

        const destinationAddress = account?.address || values.toAddress;
        setTransactionInProgress(true);
        const init = await initAvailToEthBridging({
          atomicAmount: fromAmountAtomic,
          destinationAddress: destinationAddress,
        });

        if (init.blockhash !== undefined) {
          showSuccessMessage({
            blockhash: init.blockhash,
            chain: Chain.AVAIL,
          });
        }
        setTransactionInProgress(false);
        resetState();
      }
    } catch (error) {
      console.error(error);
      setTransactionInProgress(false);
      showFailedMessage({ title: parseError(error) });
    }
  }

  function Balance() {
    return (
      <>
        <div className="flex flex-row items-end justify-start pl-1 font-ppmori ">
          {fromChain === Chain.ETH ? (
            <span className="font-ppmori flex flex-row items-center justify-center space-x-2 text-white text-opacity-70 pt-1">
              Balance{" "}
              <span className="text-white font-bold mx-1 flex flex-row">
                {account.address ? (
                  ethBalance !== undefined && ethBalance !== null ? (
                    parseFloat(parseAmount(ethBalance, 18)).toFixed(2)
                  ) : (
                    <RiLoopLeftFill
                      className={`h-4 w-4 animate-spin font-bold`}
                    />
                  )
                ) : (
                  "--"
                )}{" "}
                <p className="pl-1">AVAIL</p>
              </span>
            </span>
          ) : (
            <span className="font-ppmori flex flex-row text-white text-opacity-70">
              Balance{" "}
              <span className="text-white font-bold mx-1 flex flex-row">
                {selected ? (
                  availBalance ? (
                    parseFloat(parseAmount(availBalance, 18)).toFixed(2)
                  ) : (
                    <RiLoopLeftFill
                      className={`h-4 w-4 animate-spin font-bold`}
                    />
                  )
                ) : (
                  "--"
                )}{" "}
                <p className="pl-1">AVAIL</p>
              </span>
            </span>
          )}
        </div>
      </>
    );
  }

  async function PasteAddressAction() {
    const address = await navigator.clipboard.readText();
    const a = await validAddress(address, toChain);
    a &&
      (form.setValue("toAddress", address),
      setOpen(false),
      toast({
        title: (
          <div className="flex flex-row items-center justify-center !space-x-3 ">
            <FaCheckCircle className="mr-4 h-10 w-10" color="0BDA51" />
            <div className="flex flex-col space-y-2">
              <p className="mr-2 font-thicccboisemibold">
                Address Added Successfully
              </p>
              <p className="!text-xs !text-white !text-opacity-40 font-thicccboisemibold">
                The Address has been added successfully and would be used for
                future txns.
              </p>
            </div>
          </div>
        ),
      }));

    !a &&
      toast({
        title: (
          <div className="flex flex-row items-center justify-center !space-x-3 ">
            <RxCrossCircled className="mr-2 h-10 w-10" color="FF0000" />
            <div className="flex flex-col space-y-2">
              <p className="mr-2 font-thicccboisemibold">Invalid Address</p>
              <p className="!text-xs !text-white !text-opacity-40 font-thicccboisemibold">
                Please Check the Address you have copied
              </p>
            </div>
          </div>
        ),
      });
  }

  return (
    <div className="text-white w-full m-4">
      <Tabs
        defaultValue="bridge"
        id="container"
        className="section_bg p-2 w-[90vw] sm:w-[70vw] lg:w-[55vw] xl:w-[45vw] "
      >
        <TabsList className="flex flex-row items-start justify-start bg-transparent !border-0 p-2 mb-6 mx-2 mt-1">
          <TabsTrigger
            value="bridge"
            className="data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
          >
            <h1 className="font-ppmori text-lg">Bridge</h1>
          </TabsTrigger>
          <div className="flex flex-row pb-[2vh] items-center justify-between">
            <h1 className="font-ppmori items-center flex flex-row space-x-2 text-white text-opacity-80 text-2xl w-full ">
              <span className="relative flex flex-row items-center justify-center">
                <TabsTrigger
                  value="transactions"
                  className="relative font-ppmori text-lg data-[state=active]:bg-inherit data-[state=active]:bg-opacity-100 data-[state=active]:border-b !rounded-none"
                >
                  <p>Transactions</p>
                  {pendingTransactionsNumber > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                  )}
                </TabsTrigger>
                {window.screen.width > 768 && (
                  <div className={badgeVariants({ variant: "avail" })}>
                    {pendingTransactionsNumber > 0 ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin`} />

                        <p className="!text-left">
                          {" "}
                          {pendingTransactionsNumber} Pending{" "}
                          <span className="mx-2">|</span>{" "}
                          {readyToClaimTransactionsNumber} Claim Ready
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className={`h-4 w-4`} />

                        <p className="!text-left"> No Pending Claims</p>
                      </>
                    )}
                  </div>
                )}
              </span>
            </h1>
          </div>
        </TabsList>
        {window.screen.width < 768 && (
          <div className={badgeVariants({ variant: "avail" })}>
            {pendingTransactionsNumber > 0 ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin`} />

                <p className="!text-left">
                  {" "}
                  {pendingTransactionsNumber} Pending |{" "}
                  {readyToClaimTransactionsNumber} Ready to Claim
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className={`h-4 w-4`} />

                <p className="!text-left"> No Pending Claims</p>
              </>
            )}
          </div>
        )}
        <TabsContent id="bridge" value="bridge" className="flex-1 ">
          <div className="lg:p-4 p-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="md:space-y-4 w-full"
              >
                {/* FROM FIELD*/}
                <FormField
                  control={form.control}
                  name="fromAmount"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                          <span className="font-ppmori flex flex-row items-center space-x-2">
                            <p className="text-opacity-80 text-white ">From</p>
                            <div
                              className={badgeVariants({ variant: "avail" })}
                            >
                              <img
                                src={`/images/${fromChain}small.png`}
                                alt="logo"
                              ></img>
                              <p className="!text-left">{fromChain}</p>
                            </div>
                          </span>

                          <div className="flex flex-row items-center justify-center ">
                            {fromChain === Chain.ETH ? <Eth /> : <Avail />}
                          </div>
                        </FormLabel>
                        <FormControl>
                          <>
                            <div className="!mt-3 card_background pl-2 !rounded-xl !space-y-2 p-2 flex flex-row items-center justify-between">
                              <div className="!space-y-2 p-1 flex flex-col items-start justify-start">
                                <p className="text-white font-ppmori text-sm text-opacity-60">
                                  You send
                                </p>
                                <input
                                  className="!bg-inherit  max-md:w-24 placeholder:text-white text-white placeholder:text-2xl text-2xl p-2 !h-8"
                                  style={{
                                    border: "none",
                                    background: "none",
                                    padding: 0,
                                    margin: 0,
                                    outline: "none",
                                  }}
                                  type="number"
                                  placeholder="0.0"
                                  {...field}
                                  onChange={(event) => {
                                    field.onChange(
                                      parseFloat(event.target.value),
                                    );
                                    setFromAmount(
                                      parseFloat(event.target.value),
                                    );
                                  }}
                                />
                                <p className="text-white font-ppmori text-sm text-opacity-60">
                                  ~ {availAmountToDollars}$
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#464A5B] flex flex-row  transform transition-transform duration-200 hover:scale-105 items-center space-x-2 p-1 px-4 font-ppmoribsemibold text-2xl  justify-center cursor-pointer">
                                <div
                                  className={
                                    "flex flex-row items-center justify-center space-x-2  font-ppmori"
                                  }
                                >
                                  <img
                                    src={`/images/${fromChain}small.png`}
                                    alt="logo"
                                  ></img>
                                  <p className="!text-lg !text-left">
                                    {fromChain === Chain.ETH
                                      ? "ETH"
                                      : fromChain.toLocaleUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row items-center justify-between">
                              <Balance />
                              <div className="flex flex-row items-center justify-center ">
                                <div
                                  onClick={() => {
                                    const value =
                                      fromChain === Chain.ETH
                                        ? ethBalance
                                          ? parseFloat(ethBalance) * 0.98
                                          : 0
                                        : availBalance
                                          ? parseFloat(
                                              parseAmount(availBalance, 18),
                                            ) * 0.98
                                          : 0;

                                    value && form.setValue("fromAmount", value);
                                    setFromAmount(value);
                                  }}
                                  className="font-thicccboisemibold text-[#3FB5F8] text-sm cursor-pointer"
                                >
                                  MAX
                                </div>
                              </div>
                            </div>
                          </>
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
                <div className="relative flex items-center justify-center">
                  <div className="absolute border-b border-white border-opacity-30 w-[95%] mx-auto hover:border-opacity-60"></div>
                  <HiOutlineSwitchVertical
                    onClick={() => {
                      setFromChain(toChain);
                      setToChain(fromChain);
                    }}
                    className="h-12 w-12 bg-[#3A3E4A] transform transition-transform duration-1000 hover:p-2.5 p-3 rounded-full mx-auto cursor-pointer relative z-10"
                  />
                </div>
                {/* TO FIELD*/}
                <FormField
                  control={form.control}
                  name="toAddress"
                  render={({ field }) => (
                    <>
                      <FormItem>
                        <FormLabel className="font-thicccboiregular !text-lg flex flex-row justify-between items-end  ">
                          <span className="font-ppmori flex flex-row items-center space-x-2">
                            <p className="text-opacity-80 text-white ">To</p>
                            <div
                              className={badgeVariants({ variant: "avail" })}
                            >
                              <img
                                src={`/images/${toChain}small.png`}
                                alt="logo"
                              ></img>
                              <p className="!text-left">{toChain}</p>
                            </div>
                          </span>
                          {/* this will be opposite here since it's the To feild*/}
                          {fromChain === Chain.ETH ? <Avail /> : <Eth />}
                        </FormLabel>
                        <FormControl>
                          <>
                            <div className="!mt-3 card_background pl-2 !rounded-xl !space-y-2 p-2 flex flex-row items-center justify-between">
                              <div className="!space-y-2 p-1 flex flex-col items-start justify-start">
                                <p className="text-white font-ppmori text-sm text-opacity-60">
                                  To Address
                                </p>

                                <input
                                  className="!bg-inherit max-md:w-24 placeholder:text-white text-white text-opacity-90 placeholder:text-opacity-90 placeholder:text-2xl text-2xl "
                                  style={{
                                    border: "none",
                                    background: "none",
                                    padding: 0,
                                    margin: 0,
                                    outline: "none",
                                  }}
                                  disabled={true}
                                  min={0}
                                  placeholder={
                                    fromChain === Chain.ETH
                                      ? selected?.address
                                        ? selected.address.slice(0, 10) + "..."
                                        : "0x"
                                      : account?.address
                                        ? account.address.slice(0, 10) + "..."
                                        : "0x"
                                  }
                                  {...field}
                                  onChange={(event) => {
                                    field.onChange(+event.target.value);
                                    setToAddress(event.target.value);
                                  }}
                                />
                              </div>
                              <AlertDialog open={open}>
                                <AlertDialogTrigger
                                  onClick={() => {
                                    setOpen(!open);
                                  }}
                                  className="rounded-xl bg-[#464A5B] flex flex-row  transform transition-transform duration-200 hover:scale-105 items-center space-x-2 p-1 px-4 font-ppmoribsemibold text-2xl  justify-center cursor-pointer"
                                >
                                  <span>+</span>
                                  <span className="text-sm text-white text-opacity-70">
                                    Add Address
                                  </span>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#252831] border-2 border-[#3a3b3cb1] !rounded-[1rem]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white font-ppmoribsemibold !text-lg">
                                      Transfer to different Address
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-[#B6B7BB] font-thicccboisemibold text-md">
                                      <div className=" border-white border-t border-opacity-25 w-full !h-1 mb-4"></div>
                                      <div className="flex flex-row items-bottom pt-2"></div>
                                      <div className="items-start flex  space-x-2 px-2 pb-4">
                                        <Checkbox
                                          id="terms1"
                                          checked={isChecked}
                                          onCheckedChange={setIsChecked}
                                          className="text-white border-white border-opacity-70 border rounded-md mt-1"
                                        ></Checkbox>
                                        <div className="grid gap-1.5 leading-none">
                                          <label
                                            htmlFor="terms1"
                                            className="text-sm font-light leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white text-opacity-60"
                                          >
                                            Please double-check if the address
                                            is correct. Any tokens sent to an
                                            incorrect address will be
                                            unrecoverable.
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
                                      className="!bg-inherit !border-0 text-red-600 hover:text-red-800 "
                                    >
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      disabled={!isChecked}
                                      className="rounded-xl bg-[#464A5B] flex flex-row  items-center space-x-2 p-1 px-4 font-ppmoribsemibold text-2xl  justify-center cursor-pointer"
                                      onClick={PasteAddressAction}
                                    >
                                      <span>+</span>
                                      <span className="text-sm text-white text-opacity-70">
                                        Copy Address from Clipboard
                                      </span>
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </>
                        </FormControl>
                        <div className="flex flex-row items-center justify-between">
                          <div className="flex flex-row items-end justify-start pl-1 font-ppmori text-opacity-70"></div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
                <br />
                <LoadingButton
                  variant={"primary"}
                  loading={transactionInProgress}
                  type="submit"
                  className="!rounded-xl w-full !text-[15px] !py-8  font-ppmori"
                  disabled={isDisabled}
                >
                  {buttonStatus}
                </LoadingButton>
              </form>
            </Form>
          </div>
        </TabsContent>
        <TabsContent
          id="transactions"
          value="transactions"
          className="text-white h-full"
        >
          <TransactionSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import * as React from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown01, ChevronDown } from "lucide-react";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export function ChainSelectDropdown() {
  const [showStatusBar, setShowStatusBar] = React.useState<Checked>(true);
  const [showActivityBar, setShowActivityBar] = React.useState<Checked>(false);
  const [showPanel, setShowPanel] = React.useState<Checked>(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-inherit text-white hover:border-0 !rounded-xl">
          Select Network <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#252831] border-2 border-[#303441] text-white !rounded-md">
        <button className="w-full h-10 px-3 py-2 hover:bg-inherit flex flex-row items-center justify-start ">
          <Image src="/images/eth.png" alt="eth" width={20} height={20}></Image>
          <span className="ml-4">Ethereum</span>
        </button>
        <button className="w-full h-10 text-left px-3 py-2 hover:bg-inherit flex flex-row items-center justify-start ">
          <Image src="/favicon.ico" alt="eth" width={20} height={20}></Image>{" "}
          <span className="ml-4">Avail</span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

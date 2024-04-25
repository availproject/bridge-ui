import { ConnectButton, WalletButton } from "@rainbow-me/rainbowkit";
import { CustomEthWalletButton } from "../connections/CustomEthWalletButton";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import WalletConnect from "../WalletConnect";

/* eslint-disable @next/next/no-img-element */
export default function NavBar() {
  return (
    <header className="flex flex-row justify-between items-center py-4 px-8 border-b border-gray-700">
      <div className="flex items-center space-x-4">
        <img
          alt="Avail logo"
          className="h-10"
          height="40"
          src="/images/nav.svg"
        />
       
      </div>

      <div className="flex-row flex items-center space-x-4">
       <a className="text-gray-400 hover:text-white text-sm" href="#">
          Recent Txns
        </a>
        <a className="text-gray-400 hover:text-white text-sm" href="#">
         What is Avail
        </a>
      </div>
    </header>
  );
}

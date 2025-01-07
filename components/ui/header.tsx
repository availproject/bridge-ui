import { InfoIcon } from "lucide-react";

/* eslint-disable @next/next/no-img-element */
export default function NavBar() {
  return (
    <header className="w-full top-0 !z-50 flex flex-col justify-between items-center">
      <div
        className="w-full flex flex-row px-8 pt-2 pb-2 text-sm font-[450] items-center text-center justify-center "
        style={{ backgroundColor: "#1D2A39" }}
      >
        <InfoIcon className="w-4 h-4 mr-2 text-white text-opacity-60" />{" "}
        <span className="text-white text-opacity-60">
        Ledger wallets are currently not supported on avail. Please do not send to a Ledger address on avail otherwise funds may be lost.
        </span>
      </div>
      <div className="pt-4 space-x-4 w-screen flex flex-row items-center justify-center">
        <img
          alt="Avail logo"
          className="h-10 mt-2"
          height="40"
          src="/images/nav.svg"
        />
      </div>
    </header>
  );
}

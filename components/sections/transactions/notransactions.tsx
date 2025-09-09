/**
 * Flow:
 * 1. Use Next.js Image component for optimized loading
 * 2. Prevent layout shift with proper dimensions
 */

import Image from "next/image";

export default function NoTransactions() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 !h-[520px]">
      <Image
        src="/images/notransactions.svg"
        alt="no transactions"
        width={200}
        height={200}
        className="text-opacity-80"
        priority
      />
      <p className="text-white font-thicccboisemibold text-opacity-80 text-lg">
        No transactions
      </p>
    </div>
  );
}

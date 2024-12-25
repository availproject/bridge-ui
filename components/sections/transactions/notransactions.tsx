/* eslint-disable @next/next/no-img-element */
function NoTransactions() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 !h-[520px]">
      <img
        src="/images/notransactions.svg"
        alt="no transactions"
        className="text-opacity-80"
      ></img>
      <h2 className="font-ppmoribsemibold text-center w-[70%] md:text-lg mx-auto text-white text-opacity-90">
        You don&apos;t have any transactions
        <br /> with the connected accounts
      </h2>
    </div>
  );
}

export default NoTransactions;

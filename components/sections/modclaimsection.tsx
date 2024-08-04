'use client'

/**
 * 
 * take {address} as input
 * fetch txns and status
 * 
 * allow them to claim those txns
 * 
 * make a transfer button(simple extrinsic which sends .25 avail to address inputed)
 */

import { useState } from "react";
import { z } from "zod";
import Avail from "../wallets/avail";
import Eth from "../wallets/eth";
import { getTransactionsFromIndexer } from "@/services/transactions";
import { Transaction } from "@/types/transaction";
import { readSync } from "fs";

// Define the schema using zod
const stringSchema = z.string().min(1, "String cannot be empty");

export default function ModClaimSection() {
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>)  => {
    e.preventDefault();
    try {
      stringSchema.parse(inputValue);
      setError(null);
      //check address type and fetch txns based on that
const txns = await getTransactionsFromIndexer({availAddress: inputValue});
setTransactions(txns);
      console.log("Valid input:", inputValue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
<h1>Connect Accounts</h1>
<Eth></Eth>
<Avail  ></Avail>

{transactions.filter((txn)=> {
  return txn.status !== "CLAIMED";
}).map((txn) => {
  return (

    <>{txn.status} {txn.sourceTransactionHash}</>
  );
} )}
      <div>
        <label htmlFor="input">Input:</label>
        <input
          type="text"
          id="input"
          value={inputValue}
          onChange={handleChange}
        />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}

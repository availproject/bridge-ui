/**
 * 
 * take {address} as input
 * fetch txns and status
 * 
 * allow them to claim those txns
 * 
 * make a transfer buttoh(simple extrinsic which sends .25 avail to address inputed)
 */

import { useState } from "react";
import { z } from "zod";

// Define the schema using zod
const stringSchema = z.string().min(1, "String cannot be empty");

export default function ModClaimSection() {
  const [inputValue, setInputValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      stringSchema.parse(inputValue);
      setError(null);
      // Handle valid input
      console.log("Valid input:", inputValue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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

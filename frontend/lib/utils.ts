import { toast } from "@/components/ui/use-toast";
import axios from "axios";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const apiUrl = 'http://localhost:8000';

export async function getSignature(account: any) {
  try {
    const signer = account.wallet.signer;
    const timestamp = Date.now();
    const { signature } = await signer.signRaw({
      type: "payload",
      data: `Greetings from Avail!\n\nSign this message to check your eligibility. This signature will not cost you any fees.\n\nTimestamp: ${timestamp}`,
      address: account.address,
    });
    return {
      signature,
      timestamp
    };
  } catch (err: any) {
    toast({
      title: `${err}`,
    })
  }
}

export const formatTime = (seconds: number) => `${Math.floor(seconds / 86400)}D:${Math.floor((seconds % 86400) / 3600)}H:${Math.floor((seconds % 3600) / 60)}M`;

export async function githubLogout() {
  try {
    const res = await axios
      .get(apiUrl + "/auth/github/logout", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.error(error);
      });
    return res;
  } catch (err) {
    console.error(err);
  }
}

export async function getEndTimeStamp() {
  try {
    const res = await axios
      .get(apiUrl + "/end-time", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.error(error);
      });
    return res;
  } catch (err) {
    console.error(err);
  }
}

export async function whoAmI() {
  try {
    const res = await axios
      .get(apiUrl + "/auth/github/user", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.error(error);
      });
    return res;
  } catch (err) {
    console.error(err);
  }
}
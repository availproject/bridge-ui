import { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    substrate: {
      address: string;
      message: string;
      signature: string;
    };
    eth: {
      address: string;
      message: string;
      signature: string;
    } & DefaultSession;
  }
}

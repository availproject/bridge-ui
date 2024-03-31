import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "./providers";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/components/connections/SessionProvider";
import { FooterSection } from "@/components/FooterSection/FooterSection";
import { Footer } from "@/components/Footer/Footer";
import { Toaster } from "@/components/ui/toaster";
import NavBar from "@/components/ui/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "bridge-ui",
  description: "",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  return (
    <html lang="en">
     
      <body className={inter.className}>

        <Providers>
          <SessionProvider session={session}>
          <NavBar/>
            {children}
            </SessionProvider>
          <Toaster />
          <FooterSection title={"Accelerating the unification of web3"} description={"Mainnet is coming soon!"}/>
          <Footer />
          </Providers>
      </body>
    </html>
  );
}

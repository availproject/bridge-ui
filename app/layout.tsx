import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "./providers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NavBar from "@/components/ui/header";
import { FooterSection } from "@/components/ui/FooterSection/FooterSection";
import { Footer } from "@/components/ui/Footer/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Avail | Bridge",
  description: "",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
     
      <body className={inter.className}>

        <Providers>  
          <NavBar/>
            {children}
           <Toaster />
          <FooterSection title={"Accelerating the unification of web3"} description={"DA Mainnet is now live!"}/>
          <Footer />
          </Providers>
      </body>
    </html>
  );
}

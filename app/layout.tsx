import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "./providers";
import "./globals.css";
import { FooterSection } from "@/components/sections/FooterSection/FooterSection";
import { Footer } from "@/components/sections/FooterSection/Footer/Footer";
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
  return (
    <html lang="en">
     
      <body className={inter.className}>

        <Providers>
        
          <NavBar/>
            {children}
            
          <Toaster />
          <FooterSection title={"Accelerating the unification of web3"} description={"Mainnet is coming soon!"}/>
          <Footer />
          </Providers>
      </body>
    </html>
  );
}

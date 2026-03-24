/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NavBar from "@/components/ui/header";
import { FooterSection } from "@/components/ui/FooterSection/FooterSection";
import { Footer } from "@/components/ui/Footer/Footer";
import DatadogInit from "./datadog-init";
import { Analytics } from "@vercel/analytics/react";
import { SupportButton } from "@/components/ui/SupportButton/SupportButton";


export const metadata: Metadata = {
  title: "Avail | Bridge",
  description: "Official Avail Bridge between Avail and other chains",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body>
      <Analytics/>
        <Providers>  
          <NavBar/>
          <DatadogInit />
            {children}
           <Toaster />
          <FooterSection title={"Accelerating the unification of web3"} description={"DA Mainnet is now live!"}/>
          <Footer />
          <SupportButton />
          </Providers>
      </body>
    </html>
  );
}

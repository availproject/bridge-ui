"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "../ui/sectionheader/sectionheader";
import { Button } from "../ui/button";
import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { faqData } from "@/static/data";

export default function FaqSection() {
 return (
    <div className="pt-20 pb-32">
      <div className="flex flex-col items-center justify-center space-y-8">
        <SectionHeader buttonText={"FAQ"} heading="Frequently Asked Questions" />
      </div>
      <div className="flex flex-col space-y-4 ">

      </div>
      <div className="flex pt-20 w-[80vw] mx-auto items-center justify-center flex-col space-y-5 ">
        <Accordion type="multiple" className="w-full space-y-4">
          {faqData.map((faq, index) => {
            return (
              <div
                key={index}
                className="p-4 bg-[#252831] rounded-xl border-[#303441] border "
              >
                <AccordionItem value={`item-${index}`}>
                  <AccordionTrigger className="text-white">
                   {faq.question || 'not configured'}
                  </AccordionTrigger>
                  <AccordionContent className="text-white">
                  {faq.answer || 'not configured'}
                  </AccordionContent>
                </AccordionItem>
              </div>
            );
          })}
        </Accordion>
      </div>
    </div>
  )
}
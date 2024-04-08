/* eslint-disable @next/next/no-img-element */

import { Button } from "@/components/ui/button";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { CheckCircle, ExternalLinkIcon } from "lucide-react";
import { badgeVariants } from "../ui/badge";

export default function StatusSection() {
  return (
    <div className="section_bg !text-white w-[30vw] p-6 space-y-4 ">
      <h2 className="subheading pb-4">Status</h2>

      <ol className="relative border-s-2 border-gray-600  dark:border-gray-700">
      <li className="mb-10 ms-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-[#232735] rounded-full -start-3 ">
            <CheckCircle className="w-5 h-5 text-[#3E98E8] text-opacity-80" />
          </span>
          <h3 className="flex items-center mb-1 text-lg font-semibold font-thicccboisemibold">
            Initiated
          </h3>
          <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            Released on January 13th, 2022
          </time>


        </li>
      <li className="mb-10 ms-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-[#232735] rounded-full -start-3 ">
            <CheckCircle className="w-5 h-5 text-[#3E98E8] text-opacity-80" />
          </span>
          <h3 className="flex items-center mb-1 text-lg font-semibold font-thicccboisemibold">
            Bridged
          </h3>
          <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            Released on January 13th, 2022
          </time>


        </li>
        
        
        <li className="mb-10 ms-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-[#232735] rounded-full -start-3 ">
            <CheckCircle className="w-5 h-5 text-[#3E98E8] text-opacity-80" />
          </span>
          <h3 className="flex items-center mb-1 text-lg font-semibold font-thicccboisemibold">
            Sent{" "}
            <span className={badgeVariants({ variant: "default" })}>
              Latest
            </span>
          </h3>
          <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            Released on January 13th, 2022
          </time>

          <a
            href="#"
            className=" mt-4 inline-flex items-center px-4 py-3 text-sm font-medium text-white bg-[#121a23]  rounded-lg   focus:z-10 focus:ring-4 focus:outline-none "
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            See Transaction
          </a>
        </li>
      </ol>
    </div>
  );
}

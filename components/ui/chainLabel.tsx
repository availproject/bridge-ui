/* eslint-disable @next/next/no-img-element */
import * as React from "react"
import { Chain } from "@/types/common"
import Image from "next/image"

type ChainLabelProps = {
    chain: Chain
}

function ChainLabel({ chain }: ChainLabelProps) {
    return (
        chain === Chain.ETH ? (
            <div className="flex flex-row items-center justify-center space-x-1">
                {" "}
                <img
                    src="/images/ETHEREUMsmall.png"
                    alt="eth"
                    className=" w-4 h-4"
                  
                ></img>
                <p className="hidden md:flex text-opacity-70 text-white text-sm">Ethereum</p>
            </div>
        ) : (
            <div className="flex flex-row items-center justify-center space-x-1">
                {" "}
                <img
                    src="/images/AVAILsmall.png"
                    alt="avail"
                    className=" w-4 h-4"
                 
                ></img>
                <p className="hidden md:flex text-opacity-70 text-white text-sm m">Avail</p>
            </div>
        )
    )
}

export { ChainLabel }

import * as React from "react"
import { Chain } from "@/types/common"
import Image from "next/image"

type ChainLabelProps = {
    chain: Chain
}

function ChainLabel({ chain }: ChainLabelProps) {
    return (
        chain === Chain.ETH ? (
            <p className="flex flex-row space-x-1">
                {" "}
                <img
                    src="/images/ETHEREUMsmall.png"
                    alt="eth"
                    className="object-contain"
                  
                ></img>
                <p>ETH</p>
            </p>
        ) : (
            <p className="flex flex-row space-x-1">
                {" "}
                <img
                    src="/images/AVAILsmall.png"
                    alt="avail"
                    className="object-contain"
                 
                ></img>
                <p>AVAIL</p>
            </p>
        )
    )
}

export { ChainLabel }

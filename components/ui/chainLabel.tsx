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
                <Image
                    src="/images/eth.png"
                    alt="eth"
                    width={18}
                    height={14}
                ></Image>
                <p>ETH</p>
            </p>
        ) : (
            <p className="flex flex-row space-x-1">
                {" "}
                <Image
                    src="/images/logo.png"
                    alt="avail"
                    width={16}
                    height={1}
                ></Image>
                <p>AVAIL</p>
            </p>
        )
    )
}

export { ChainLabel }

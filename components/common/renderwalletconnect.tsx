import { Chain } from "@/types/common";
import AvailWalletConnect from "../wallets/avail";
import Eth from "../wallets/eth";

type Props = {
    fromChain: Chain;
    toChain: Chain;
    type: "depositor" | "receiver";
};

export default function RenderWalletConnect(props: Props) {
    const { fromChain, toChain, type } = props;

    if (type === "receiver") {
        switch (toChain) {
            case Chain.AVAIL:
                return <AvailWalletConnect />;
            case Chain.BASE:
                return <Eth />;
            case Chain.ETH:
                return <Eth />;
            default:
                return <>Invalid Chain</>;
        }
    }

    if (type === "depositor") {
        switch (fromChain) {
            case Chain.ETH:
                return <Eth />;
            case Chain.AVAIL:
                return <AvailWalletConnect />;
            case Chain.BASE:
                return <Eth />;
            default:
                return <>Invalid Chain</>;
        }
    }
}


import FromField from "./fromfield";
import ToField from "./tofield";
import ChainSwapBtn from "../../chainselector/chainswapbtn";
import ReviewButton from "./review-btn";

export default function BridgeSection() {

  return (
    <div className="lg:p-4 p-2">
      <div className="md:space-y-4 w-full">
        <FromField/>
        <ChainSwapBtn/>
        <ToField />
        <ReviewButton />
      </div>
    </div>
  );
}

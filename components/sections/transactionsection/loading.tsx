import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-8">
      <Loader2 className={`h-12 w-12 animate-spin`} />
      <p className="font-thicccboisemibold text-[#f6f4f4e1] text-lg">Tranasactions Loading</p>
    </div>
  );
}

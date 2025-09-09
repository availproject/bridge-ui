import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FetchErrorProps {
  onRetry?: () => void;
}

export default function FetchError({ onRetry }: FetchErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 h-[520px]">
      <div className="flex flex-col items-center space-y-3">
        <div className="rounded-full bg-red-500/10 p-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-white">
          Failed to fetch transactions
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-sm pb-8">
          We could not load your transactions. This might be a temporary issue.
          Please try again.
        </p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-[#484C5D] hover:bg-[#5A5E6F] text-white px-12"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

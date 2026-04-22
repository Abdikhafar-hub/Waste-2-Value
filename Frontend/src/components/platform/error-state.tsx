import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-[#f4c7c2] bg-[#fff8f7] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white p-2 text-danger shadow-xs">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#7a271a]">Something needs attention</p>
          <p className="mt-1 text-sm text-[#9f3b2f]">{message}</p>
        </div>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}

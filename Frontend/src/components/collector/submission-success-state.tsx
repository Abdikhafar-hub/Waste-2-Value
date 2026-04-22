import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionSuccessStateProps {
  reference: string;
  submissionId: string;
  onSubmitAnother: () => void;
}

export function SubmissionSuccessState({ reference, submissionId, onSubmitAnother }: SubmissionSuccessStateProps) {
  return (
    <div className="rounded-2xl border border-[#bfe2cd] bg-[#ecf8f1] p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <p className="text-lg font-semibold text-foreground">Submission sent successfully</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Reference <span className="font-semibold text-foreground">{reference}</span> is now in review queue.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/collector/submissions/${submissionId}`}>
          <Button size="sm">View Submission</Button>
        </Link>
        <Button size="sm" variant="secondary" onClick={onSubmitAnother}>
          Submit Another
        </Button>
      </div>
    </div>
  );
}

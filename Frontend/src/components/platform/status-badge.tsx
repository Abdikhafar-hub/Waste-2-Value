import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const styleMap: Record<string, string> = {
  ACTIVE: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  SUSPENDED: "bg-[#fff2f0] text-[#b42318] border-[#f4c7c2]",
  DRAFT: "bg-[#f3f4f6] text-[#4b5563] border-[#e0e3e7]",
  INVITED: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  INACTIVE: "bg-[#f3f4f6] text-[#4b5563] border-[#e0e3e7]",
  IN: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  OUT: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  ADJUSTMENT: "bg-[#eef6ff] text-[#1d4f91] border-[#cde1f9]",
  SUBMITTED: "bg-[#eef6ff] text-[#1d4f91] border-[#cde1f9]",
  AWAITING_RECEIPT: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  RECEIVED: "bg-[#eaf4ff] text-[#215391] border-[#cfe2f8]",
  UNDER_REVIEW: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  APPROVED: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  REJECTED: "bg-[#fff2f0] text-[#b42318] border-[#f4c7c2]",
  ASSIGNED: "bg-[#eaf4ff] text-[#215391] border-[#cfe2f8]",
  IN_PROCESSING: "bg-[#effaf4] text-[#1f7a4f] border-[#cbe9d8]",
  PROCESSED: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  QUEUED: "bg-[#eef6ff] text-[#1d4f91] border-[#cde1f9]",
  COMPLETED: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  LOW: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  RISK: "bg-[#fff2f0] text-[#b42318] border-[#f4c7c2]",
  GOOD: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  PAID: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  PENDING: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
  SUCCESS: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  FAILED: "bg-[#fff2f0] text-[#b42318] border-[#f4c7c2]",
  IN_TRANSIT: "bg-[#eef6ff] text-[#1d4f91] border-[#cde1f9]",
  DELIVERED: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  READY: "bg-[#e7f5ed] text-[#11643c] border-[#c9e5d5]",
  NOT_STARTED: "bg-[#f3f4f6] text-[#4b5563] border-[#e0e3e7]",
  ADMIN_CREATED: "bg-[#eef6ff] text-[#1d4f91] border-[#cde1f9]",
  SETUP_IN_PROGRESS: "bg-[#fff7e8] text-[#9c5a03] border-[#f3dcab]",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        styleMap[status] ?? "bg-[#f3f4f6] text-[#4b5563] border-[#e0e3e7]",
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

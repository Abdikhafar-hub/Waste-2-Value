import { cn } from "@/lib/utils";
import { type TeamRole } from "@/types/org-admin";

const roleStyles: Record<TeamRole, string> = {
  ORG_ADMIN: "bg-[#e8f2ff] border-[#cde1f9] text-[#184c8f]",
  COLLECTOR: "bg-[#eaf7f0] border-[#c9e5d5] text-[#11643c]",
  PROCESSOR: "bg-[#fff4ea] border-[#f3d4b3] text-[#9a5416]",
  BUYER: "bg-[#f4f2ff] border-[#d9d2fd] text-[#5b3dbf]",
};

export function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", roleStyles[role])}>
      {role.replaceAll("_", " ")}
    </span>
  );
}

import { type ReactNode } from "react";
import { OrgAdminShell } from "@/components/layout/org-admin-shell";

export default function OrgAdminLayout({ children }: { children: ReactNode }) {
  return <OrgAdminShell>{children}</OrgAdminShell>;
}

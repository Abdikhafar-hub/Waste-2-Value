import { type ReactNode } from "react";
import { ProcessorShell } from "@/components/layout/processor-shell";

export default function ProcessorLayout({ children }: { children: ReactNode }) {
  return <ProcessorShell>{children}</ProcessorShell>;
}

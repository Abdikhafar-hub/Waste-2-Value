import { type ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="scrollbar-subtle overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full divide-y divide-border bg-white">
        <thead className="bg-surface-soft">
          <tr>
            {headers.map((header, index) => (
              <th key={`${header}-${index}`} className="table-head px-4 py-3 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

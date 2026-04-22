"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { SectionCard } from "@/components/platform/section-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Select } from "@/components/ui/select";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { formatDateTime } from "@/lib/utils";
import { type AuditEvent, type AuditQuery } from "@/types/platform";

export default function AuditPage() {
  const [query, setQuery] = useState<AuditQuery>({
    search: "",
    entityType: "ALL",
    action: "ALL",
  });
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const actionsResource = useAsyncResource(() => platformService.listAuditActions(), []);
  const eventsResource = useAsyncResource(() => platformService.getAuditEvents(query), [
    query.search,
    query.entityType,
    query.action,
  ]);

  return (
    <div>
      <PageHeader
        title="Platform Audit Log"
        description="Search and inspect platform-level control events, actors, and metadata."
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search action, actor, entity, metadata"
        filters={
          <>
            <Select
              value={query.entityType ?? "ALL"}
              onChange={(event) =>
                setQuery((prev) => ({
                  ...prev,
                  entityType: event.target.value as AuditQuery["entityType"],
                }))
              }
              className="w-[170px]"
            >
              <option value="ALL">All Entities</option>
              <option value="ORGANIZATION">Organization</option>
              <option value="USER">User</option>
              <option value="AUTH">Auth</option>
              <option value="PLATFORM">Platform</option>
            </Select>

            <Select
              value={query.action ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, action: event.target.value }))}
              className="w-[220px]"
            >
              <option value="ALL">All Actions</option>
              {(actionsResource.data ?? []).map((action) => (
                <option key={action} value={action}>
                  {action.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {eventsResource.error ? (
        <ErrorState message={eventsResource.error} onRetry={() => void eventsResource.reload()} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {eventsResource.loading || !eventsResource.data ? (
            <LoadingState rows={8} />
          ) : eventsResource.data.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No audit events found"
              message="Try broadening your search and filter criteria."
            />
          ) : (
            <DataTable headers={["Action", "Entity", "Actor", "Timestamp", "Type"]}>
              {eventsResource.data.map((event) => (
                <tr
                  key={event.id}
                  className="cursor-pointer hover:bg-surface-soft/60"
                  onClick={() => setSelected(event)}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {event.action.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{event.entityName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{event.actorName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(event.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={event.entityType} />
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>

        <SectionCard title="Event Detail" subtitle="Select an audit row for complete metadata" compact>
          {selected ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</p>
                <p className="text-sm font-semibold text-foreground">{selected.action.replaceAll("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actor</p>
                <p className="text-sm text-foreground">{selected.actorName}</p>
                <p className="text-xs text-muted-foreground">{selected.actorEmail}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entity</p>
                <p className="text-sm text-foreground">{selected.entityName}</p>
                <p className="text-xs text-muted-foreground">{selected.entityType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timestamp</p>
                <p className="text-sm text-foreground">{formatDateTime(selected.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metadata</p>
                <div className="mt-1 rounded-lg border border-border bg-surface-soft p-2">
                  {Object.entries(selected.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-2 py-1 text-xs">
                      <span className="font-semibold text-foreground">{key}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
              No event selected yet.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

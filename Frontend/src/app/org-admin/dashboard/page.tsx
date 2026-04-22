"use client";

import Link from "next/link";
import { Eye, PackagePlus, UserPlus, Wallet, Warehouse } from "lucide-react";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { KpiCard } from "@/components/platform/kpi-card";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatCompactNumber, formatCurrency, formatDateTime, formatWeightKg } from "@/lib/utils";

export default function OrgAdminDashboardPage() {
  const dashboard = useAsyncResource(() => orgAdminService.getDashboardData(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operations Dashboard"
        description="Live organizational control center across waste intake, processing, inventory, and revenue."
        actions={
          <>
            <Link href="/org-admin/waste">
              <Button variant="secondary" size="sm">
                <Eye className="h-4 w-4" />
                Review Waste
              </Button>
            </Link>
            <Link href="/org-admin/team">
              <Button variant="secondary" size="sm">
                <UserPlus className="h-4 w-4" />
                Create User
              </Button>
            </Link>
            <Link href="/org-admin/products">
              <Button size="sm">
                <PackagePlus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </>
        }
      />

      {dashboard.error ? <ErrorState message={dashboard.error} onRetry={() => void dashboard.reload()} /> : null}

      {dashboard.loading || !dashboard.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
            <KpiCard label="Waste Collected" value={formatWeightKg(dashboard.data.kpis.totalWasteKg)} trend="This month" />
            <KpiCard label="Pending Approvals" value={String(dashboard.data.kpis.pendingApprovals)} trend="Needs review" />
            <KpiCard label="Active Processors" value={String(dashboard.data.kpis.activeProcessors)} trend="On shift" />
            <KpiCard label="Credits Issued" value={formatCompactNumber(dashboard.data.kpis.creditsIssued)} trend="Collector incentives" />
            <KpiCard label="Inventory Value" value={formatCurrency(dashboard.data.kpis.inventoryValue)} trend="Current stock" />
            <KpiCard label="Orders" value={String(dashboard.data.kpis.totalOrders)} trend="Open + closed" />
            <KpiCard label="Revenue" value={formatCurrency(dashboard.data.kpis.totalRevenue)} trend="Paid orders" />
          </section>

          <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
            <SectionCard title="Waste Pipeline" subtitle="Operational throughput from collection to processing" compact>
              <div className="space-y-2">
                {dashboard.data.wastePipeline.map((step) => (
                  <div key={step.status} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>{step.status.replaceAll("_", " ")}</span>
                      <span>{step.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-soft">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, step.value * 14)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Quick Actions" subtitle="High-frequency operations" compact>
              <div className="grid gap-2">
                <Link href="/org-admin/waste">
                  <Button variant="secondary" className="w-full justify-start">Review waste submissions</Button>
                </Link>
                <Link href="/org-admin/team">
                  <Button variant="secondary" className="w-full justify-start">Create team user</Button>
                </Link>
                <Link href="/org-admin/products">
                  <Button variant="secondary" className="w-full justify-start">Add product</Button>
                </Link>
                <Link href="/org-admin/inventory">
                  <Button variant="secondary" className="w-full justify-start">
                    <Warehouse className="h-4 w-4" />
                    View inventory
                  </Button>
                </Link>
                <Link href="/org-admin/wallet">
                  <Button variant="secondary" className="w-full justify-start">
                    <Wallet className="h-4 w-4" />
                    Review redemptions
                  </Button>
                </Link>
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
            <SectionCard title="Submissions Needing Review" subtitle="Most recent entries awaiting decision" compact>
              {dashboard.data.reviewQueue.length === 0 ? (
                <EmptyState icon={Eye} title="No pending submissions" message="Review queue is currently clear." />
              ) : (
                <DataTable headers={["Ref", "Collector", "Type", "Weight", "Zone", "Status", "Action"]}>
                  {dashboard.data.reviewQueue.map((submission) => (
                    <tr key={submission.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{submission.reference}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{submission.collectorName}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{submission.wasteType}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{formatWeightKg(submission.weightKg)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{submission.zone}</td>
                      <td className="px-4 py-3"><StatusBadge status={submission.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/org-admin/waste/${submission.id}`}>
                          <Button variant="secondary" size="sm">Open</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Processing Activity" subtitle="Current batch movement" compact>
                <div className="space-y-2">
                  {dashboard.data.processingActivity.map((batch) => (
                    <div key={batch.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{batch.reference}</p>
                        <StatusBadge status={batch.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {batch.processorName} • {batch.wasteType} • {formatWeightKg(batch.inputKg)}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Low Inventory Alerts" subtitle="Lots requiring immediate attention" compact>
                {dashboard.data.lowInventory.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    No inventory risk flags.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dashboard.data.lowInventory.map((lot) => (
                      <div key={lot.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">{lot.productName}</p>
                          <StatusBadge status={lot.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Lot {lot.lotCode} • {lot.quantity} {lot.unit} • {lot.location}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </section>

          <SectionCard title="Recent Orders" subtitle="Latest commercial activity" compact>
            <DataTable headers={["Order", "Buyer", "Total", "Payment", "Delivery", "Created"]}>
              {dashboard.data.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-soft/60">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{order.buyerName}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={order.deliveryStatus} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>
        </>
      )}
    </div>
  );
}

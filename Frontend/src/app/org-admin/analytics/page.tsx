"use client";

import { LineChart } from "lucide-react";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatCurrency, formatWeightKg } from "@/lib/utils";

export default function OrgAdminAnalyticsPage() {
  const analytics = useAsyncResource(() => orgAdminService.getAnalytics(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Organization Analytics"
        description="Tenant-level trends across waste intake, approvals, processing output, credits, and revenue."
      />

      {analytics.error ? <ErrorState message={analytics.error} onRetry={() => void analytics.reload()} /> : null}

      {analytics.loading || !analytics.data ? (
        <LoadingState rows={8} />
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Waste by Type" subtitle="Total collected by material" compact>
              <div className="space-y-2">
                {analytics.data.wasteByType.map((item) => (
                  <div key={item.type} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                      <span>{item.type}</span>
                      <span>{formatWeightKg(item.weightKg)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-soft">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, item.weightKg / 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Waste by Zone" subtitle="Collection performance by area" compact>
              <div className="space-y-2">
                {analytics.data.wasteByZone.map((item) => (
                  <div key={item.zone} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                      <span>{item.zone}</span>
                      <span>{formatWeightKg(item.weightKg)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-soft">
                      <div className="h-2 rounded-full bg-[#2b8d5f]" style={{ width: `${Math.min(100, item.weightKg / 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Approval Trend" subtitle="Weekly approval vs rejection" compact>
              <div className="space-y-2">
                {analytics.data.approvalsTrend.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <div className="mt-2 grid gap-1">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Approved {item.approved}</p>
                        <div className="h-2 rounded-full bg-surface-soft"><div className="h-2 rounded-full bg-brand" style={{ width: `${item.approved * 2}%` }} /></div>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Rejected {item.rejected}</p>
                        <div className="h-2 rounded-full bg-surface-soft"><div className="h-2 rounded-full bg-danger" style={{ width: `${item.rejected * 10}%` }} /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Processor Output Trend" subtitle="Weekly output volume" compact>
              <div className="space-y-2">
                {analytics.data.processorOutputTrend.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{formatWeightKg(item.outputKg)}</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-soft">
                      <div className="h-2 rounded-full bg-[#2f9263]" style={{ width: `${Math.min(100, item.outputKg / 9)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Credits Issued" subtitle="Incentive issuance trend" compact>
              <div className="space-y-2">
                {analytics.data.creditsIssuedTrend.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.credits}</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-soft"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, item.credits / 70)}%` }} /></div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Revenue Trend" subtitle="Sales trajectory" compact>
              <div className="space-y-2">
                {analytics.data.revenueTrend.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-soft"><div className="h-2 rounded-full bg-[#1f7a4f]" style={{ width: `${Math.min(100, item.revenue / 1300)}%` }} /></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>

          <SectionCard title="Analytics Note" subtitle="Operational interpretation" compact>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-soft p-4">
              <LineChart className="h-5 w-5 text-brand" />
              <p className="text-sm text-muted-foreground">
                Waste throughput and processor outputs are trending upward with rejection rates gradually declining,
                indicating stronger quality intake and better assignment discipline across zones.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

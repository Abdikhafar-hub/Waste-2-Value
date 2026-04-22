"use client";

import { Trophy } from "lucide-react";
import { ReputationStatCard } from "@/components/collector/reputation-stat-card";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { collectorService } from "@/lib/services/collector-service";

export default function CollectorReputationPage() {
  const reputation = useAsyncResource(() => collectorService.getReputationData(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Reputation"
        description="See your reliability, approval quality, and submission performance."
      />

      {reputation.error ? <ErrorState message={reputation.error} onRetry={() => void reputation.reload()} /> : null}

      {reputation.loading || !reputation.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ReputationStatCard label="Reliability Score" value={`${reputation.data.reliabilityScore}%`} helper="Based on quality and consistency" />
            <ReputationStatCard label="Approval Rate" value={`${reputation.data.approvalRate}%`} helper="Approved vs reviewed submissions" />
            <ReputationStatCard label="Credits Earned" value={`${reputation.data.creditsEarned}`} helper="Total collected credits" />
            <ReputationStatCard label="Total Submissions" value={String(reputation.data.totalSubmissions)} />
            <ReputationStatCard label="Approved" value={String(reputation.data.approvedSubmissions)} />
            <ReputationStatCard label="Rejected" value={String(reputation.data.rejectedSubmissions)} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <SectionCard title="Weekly Performance" subtitle="Approved vs rejected trend" compact>
              <div className="space-y-2">
                {reputation.data.weeklyPerformance.map((week) => (
                  <div key={week.label} className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold text-foreground">{week.label}</p>
                    <div className="mt-2 space-y-1.5">
                      <div>
                        <p className="mb-1 text-[11px] text-muted-foreground">Approved {week.approved}</p>
                        <div className="h-2 rounded-full bg-surface-soft">
                          <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, week.approved * 12)}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] text-muted-foreground">Rejected {week.rejected}</p>
                        <div className="h-2 rounded-full bg-surface-soft">
                          <div className="h-2 rounded-full bg-danger" style={{ width: `${Math.min(100, week.rejected * 30)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Performance Insights" subtitle="Practical guidance to improve" compact>
              <div className="space-y-2">
                {reputation.data.insights.map((insight, index) => (
                  <div key={index} className="rounded-lg border border-border bg-surface-soft p-3 text-sm text-muted-foreground">
                    {insight}
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>

          <SectionCard title="Collector Milestone" subtitle="Personal motivation" compact>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-soft p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand">
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Strong field consistency</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your recent approval trend indicates improving quality submissions. Keep focusing on accurate sorting and tags.
                </p>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

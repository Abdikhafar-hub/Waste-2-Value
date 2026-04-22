"use client";

import Link from "next/link";
import { ArrowRight, Plus, Target } from "lucide-react";
import { SubmissionCard } from "@/components/collector/submission-card";
import { SubmissionStatusChip } from "@/components/collector/submission-status-chip";
import { WalletSummaryCard } from "@/components/collector/wallet-summary-card";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { Button } from "@/components/ui/button";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { collectorService } from "@/lib/services/collector-service";
import { formatCompactNumber } from "@/lib/utils";

export default function CollectorDashboardPage() {
  const dashboard = useAsyncResource(() => collectorService.getDashboardData(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Field Dashboard"
        description="Track your submissions, approvals, and credits at a glance."
        actions={
          <Link href="/collector/submissions/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Submit Waste
            </Button>
          </Link>
        }
      />

      {dashboard.error ? <ErrorState message={dashboard.error} onRetry={() => void dashboard.reload()} /> : null}

      {dashboard.loading || !dashboard.data ? (
        <LoadingState rows={6} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <WalletSummaryCard label="Total Submissions" value={String(dashboard.data.kpis.totalSubmissions)} />
            <WalletSummaryCard label="Pending" value={String(dashboard.data.kpis.pendingSubmissions)} />
            <WalletSummaryCard label="Approved" value={String(dashboard.data.kpis.approvedSubmissions)} />
            <WalletSummaryCard
              label="Credits Earned"
              value={formatCompactNumber(dashboard.data.kpis.creditsEarned)}
              helper="Lifetime earnings"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionCard title={`Welcome, ${dashboard.data.profile.firstName}`} subtitle="Your collection performance this month" compact>
              <div className="rounded-xl border border-border bg-surface-soft p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Target className="h-4 w-4 text-brand" />
                  Current Submission Streak
                </div>
                <p className="mt-2 text-3xl font-semibold text-foreground">{dashboard.data.streakDays} days</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep submitting quality-sorted waste to increase your approval rate and credits.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Status Summary" subtitle="Where your submissions are currently" compact>
              <div className="flex flex-wrap gap-2">
                {dashboard.data.statusSummary.map((item) => (
                  <div key={item.status} className="rounded-lg border border-border bg-white p-2">
                    <SubmissionStatusChip status={item.status} />
                    <p className="mt-1 text-center text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>

          <SectionCard
            title="Recent Submissions"
            subtitle="Latest submissions from your field activity"
            actions={
              <Link href="/collector/submissions" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
            compact
          >
            {dashboard.data.recentSubmissions.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No submissions yet"
                message="Your latest waste submissions will appear here once you start collecting."
              />
            ) : (
              <div className="grid gap-2">
                {dashboard.data.recentSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

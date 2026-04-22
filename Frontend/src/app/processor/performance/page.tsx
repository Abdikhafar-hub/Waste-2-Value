"use client";

import { Gauge } from "lucide-react";
import { PerformanceStatBlock } from "@/components/processor/performance-stat-block";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SectionCard } from "@/components/platform/section-card";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { processorService } from "@/lib/services/processor-service";

export default function ProcessorPerformancePage() {
  const performance = useAsyncResource(() => processorService.getPerformanceData(), []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Performance"
        description="Monitor production consistency, throughput, and reliability indicators."
      />

      {performance.error ? <ErrorState message={performance.error} onRetry={() => void performance.reload()} /> : null}

      {performance.loading || !performance.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <PerformanceStatBlock label="Completed Batches" value={String(performance.data.completedBatches)} />
            <PerformanceStatBlock label="Processed Inputs" value={String(performance.data.processedSubmissions)} />
            <PerformanceStatBlock label="Output Quantity" value={String(performance.data.totalOutputQuantity)} helper="Total recorded units" />
            <PerformanceStatBlock label="Credits Earned" value={String(performance.data.creditsEarned)} />
            <PerformanceStatBlock label="Current Streak" value={`${performance.data.processingStreak} days`} helper="Consecutive active days" />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Weekly Production Trend" subtitle="Batch closeout and output movement by week" compact>
              {performance.data.weeklyProduction.length === 0 ? (
                <EmptyState
                  icon={Gauge}
                  title="No weekly trend yet"
                  message="Production trend will populate as operational weeks close."
                />
              ) : (
                <div className="space-y-2">
                  {performance.data.weeklyProduction.map((item) => {
                    const batchWidth = Math.min(100, item.batches * 20);
                    const outputWidth = Math.min(100, item.outputs / 6);

                    return (
                      <div key={item.label} className="rounded-lg border border-border p-3">
                        <p className="text-xs font-semibold text-foreground">{item.label}</p>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="mb-1 text-[11px] text-muted-foreground">Batches {item.batches}</p>
                            <div className="h-2 rounded-full bg-surface-soft">
                              <div className="h-2 rounded-full bg-brand" style={{ width: `${batchWidth}%` }} />
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] text-muted-foreground">Outputs {item.outputs}</p>
                            <div className="h-2 rounded-full bg-surface-soft">
                              <div className="h-2 rounded-full bg-[#215391]" style={{ width: `${outputWidth}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Reliability Snapshot" subtitle="Operational consistency indicators" compact>
              <div className="rounded-xl border border-border bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reliability Score</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{performance.data.reliabilityScore}%</p>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${Math.min(100, performance.data.reliabilityScore)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Based on receipt confirmation timeliness, batch closeout quality, and output recording consistency.
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {performance.data.insights.map((insight, index) => (
                  <div key={index} className="rounded-lg border border-border bg-white p-3 text-sm text-muted-foreground">
                    {insight}
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        </>
      )}
    </div>
  );
}

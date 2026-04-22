"use client";

import Link from "next/link";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { SubmissionSuccessState } from "@/components/collector/submission-success-state";
import { WasteTypeSelector } from "@/components/collector/waste-type-selector";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { collectorService } from "@/lib/services/collector-service";
import { type CollectorSubmission, type CollectorWasteType } from "@/types/collector";

export default function NewSubmissionPage() {
  const formMeta = useAsyncResource(() => collectorService.getSubmissionFormMeta(), []);
  const createSubmission = useAsyncAction((payload: Parameters<typeof collectorService.createSubmission>[0]) =>
    collectorService.createSubmission(payload),
  );

  const [wasteType, setWasteType] = useState<CollectorWasteType>("ORGANIC");
  const [weightKg, setWeightKg] = useState("");
  const [zone, setZone] = useState("");
  const [collectionPoint, setCollectionPoint] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<CollectorSubmission | null>(null);

  const isDisabled = useMemo(() => !wasteType || !zone || !weightKg || Number(weightKg) <= 0, [wasteType, zone, weightKg]);

  const resetForm = () => {
    setWasteType("ORGANIC");
    setWeightKg("");
    setZone("");
    setCollectionPoint("");
    setTagCode("");
    setNotes("");
    setError(null);
    setSubmitted(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!zone || Number(weightKg) <= 0) {
      setError("Waste type, valid weight, and zone are required.");
      return;
    }

    setError(null);

    const result = await createSubmission.execute({
      wasteType,
      weightKg: Number(weightKg),
      zone,
      collectionPoint: collectionPoint || undefined,
      tagCode: tagCode || undefined,
      notes: notes || undefined,
    });

    setSubmitted(result);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Waste Submission"
        description="Capture and submit field waste data quickly and accurately."
        actions={
          <Link href="/collector/submissions">
            <Button size="sm" variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      {formMeta.error ? <ErrorState message={formMeta.error} onRetry={() => void formMeta.reload()} /> : null}
      {createSubmission.error ? <ErrorState message={createSubmission.error} /> : null}

      {formMeta.loading || !formMeta.data ? (
        <LoadingState rows={7} />
      ) : submitted ? (
        <SubmissionSuccessState
          reference={submitted.reference}
          submissionId={submitted.id}
          onSubmitAnother={resetForm}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-white p-4 shadow-xs sm:p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waste Type</label>
            <WasteTypeSelector value={wasteType} onChange={setWasteType} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weight (kg)</label>
              <Input
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                placeholder="e.g 125"
                type="number"
                min={0}
                step="0.1"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zone</label>
              <Select value={zone} onChange={(event) => setZone(event.target.value)}>
                <option value="">Select zone</option>
                {formMeta.data.zones.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collection Point (optional)</label>
              <Select value={collectionPoint} onChange={(event) => setCollectionPoint(event.target.value)}>
                <option value="">Select point</option>
                {formMeta.data.collectionPoints.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tag Code (optional)</label>
              <Input value={tagCode} onChange={(event) => setTagCode(event.target.value)} placeholder="TAG-0021" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Any quality details, source notes, or handling context"
            />
          </div>

          <div className="rounded-xl border border-dashed border-border bg-surface-soft p-4 text-center">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <ImagePlus className="h-4 w-4 text-brand" />
              Image upload placeholder
            </span>
            <p className="mt-1 text-xs text-muted-foreground">Camera/photo integration can be connected in API phase.</p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="pt-1">
            <Button type="submit" className="h-11 w-full text-sm" loading={createSubmission.loading} disabled={isDisabled || createSubmission.loading}>
              Submit Waste
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

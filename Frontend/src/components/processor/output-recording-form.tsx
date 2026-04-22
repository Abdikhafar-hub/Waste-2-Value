"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type RecordProcessorOutputInput } from "@/types/processor";

interface OutputRecordingFormProps {
  onSubmit: (payload: RecordProcessorOutputInput) => Promise<void>;
  loading?: boolean;
}

export function OutputRecordingForm({ onSubmit, loading }: OutputRecordingFormProps) {
  const [outputType, setOutputType] = useState<RecordProcessorOutputInput["outputType"]>("LARVAE");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<RecordProcessorOutputInput["unit"]>("kg");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => Number(quantity) <= 0 || loading, [quantity, loading]);

  const handleSubmit = async () => {
    if (Number(quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    setError(null);

    await onSubmit({
      outputType,
      quantity: Number(quantity),
      unit,
      notes: notes.trim() || undefined,
    });

    setQuantity("");
    setNotes("");
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output Type</label>
          <Select value={outputType} onChange={(event) => setOutputType(event.target.value as RecordProcessorOutputInput["outputType"])}>
            <option value="LARVAE">Larvae</option>
            <option value="FERTILIZER">Fertilizer</option>
            <option value="PLASTIC_BRICKS">Plastic Bricks</option>
            <option value="GARDEN_STAKES">Garden Stakes</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</label>
          <Input type="number" min={0} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit</label>
          <Select value={unit} onChange={(event) => setUnit(event.target.value as RecordProcessorOutputInput["unit"])}>
            <option value="kg">kg</option>
            <option value="bag">bag</option>
            <option value="piece">piece</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (optional)</label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Output quality or packaging notes" />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="button" onClick={() => void handleSubmit()} loading={loading} disabled={disabled}>
        Record Output
      </Button>
    </div>
  );
}

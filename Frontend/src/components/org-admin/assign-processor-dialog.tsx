"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface AssignProcessorDialogProps {
  open: boolean;
  onClose: () => void;
  processors: Array<{ id: string; label: string }>;
  onAssign: (processorId: string) => Promise<void>;
  loading?: boolean;
}

export function AssignProcessorDialog({ open, onClose, processors, onAssign, loading }: AssignProcessorDialogProps) {
  const [processorId, setProcessorId] = useState(processors[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleAssign = async () => {
    if (!processorId) {
      setError("Select a processor.");
      return;
    }

    setError(null);
    await onAssign(processorId);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Processor"
      description="Assign this waste submission to an active processor."
      className="max-w-md"
    >
      <div className="space-y-3">
        <Select value={processorId} onChange={(event) => setProcessorId(event.target.value)}>
          {processors.map((processor) => (
            <option key={processor.id} value={processor.id}>
              {processor.label}
            </option>
          ))}
        </Select>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleAssign()} loading={loading}>Assign</Button>
        </div>
      </div>
    </Modal>
  );
}

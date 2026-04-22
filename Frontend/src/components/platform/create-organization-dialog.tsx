"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type CreateOrganizationInput } from "@/types/platform";

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateOrganizationInput) => Promise<void>;
  loading?: boolean;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateOrganizationDialog({
  open,
  onClose,
  onCreate,
  loading,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CreateOrganizationInput["status"]>("ACTIVE");
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => !name.trim() || !slug.trim() || loading, [name, slug, loading]);

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Organization name and slug are required.");
      return;
    }

    setError(null);
    await onCreate({
      name: name.trim(),
      slug: toSlug(slug),
      description: description.trim(),
      status,
    });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(toSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(toSlug(value));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Organization"
      description="Set up a new tenant and prepare it for org-admin onboarding."
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Organization Name
          </label>
          <Input value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="EcoLoop Nairobi" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Slug
          </label>
          <Input value={slug} onChange={(event) => handleSlugChange(event.target.value)} placeholder="ecoloop-nairobi" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe this organization briefly."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Initial Status
          </label>
          <Select value={status} onChange={(event) => setStatus(event.target.value as CreateOrganizationInput["status"])}>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} loading={loading} disabled={disabled}>
            Create Organization
          </Button>
        </div>
      </div>
    </Modal>
  );
}

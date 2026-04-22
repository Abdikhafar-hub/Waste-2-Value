"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { type CreateOrganizationAdminInput, type Organization } from "@/types/platform";

interface CreateOrgAdminDialogProps {
  open: boolean;
  organization?: Organization;
  onClose: () => void;
  onCreate: (payload: CreateOrganizationAdminInput) => Promise<void>;
  loading?: boolean;
}

export function CreateOrgAdminDialog({
  open,
  organization,
  onClose,
  onCreate,
  loading,
}: CreateOrgAdminDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("Temp#2026");
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(
    () => !firstName.trim() || !lastName.trim() || !email.trim() || !temporaryPassword.trim() || loading,
    [email, firstName, lastName, loading, temporaryPassword],
  );

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !temporaryPassword.trim()) {
      setError("First name, last name, email and temporary password are required.");
      return;
    }

    setError(null);

    await onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      temporaryPassword,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Initial Organization Admin"
      description={
        organization
          ? `You are creating the first organization admin for ${organization.name}.`
          : "You are creating the first organization admin for this tenant."
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">First Name</label>
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Amina" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Name</label>
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Odede" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@organization.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone (Optional)</label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254712000001" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Temporary Password</label>
          <Input
            value={temporaryPassword}
            onChange={(event) => setTemporaryPassword(event.target.value)}
            placeholder="Temp#2026"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} loading={loading} disabled={disabled}>
            Create Org Admin
          </Button>
        </div>
      </div>
    </Modal>
  );
}

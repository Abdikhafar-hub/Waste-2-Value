"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { type CreateTeamUserInput } from "@/types/org-admin";

interface CreateTeamUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTeamUserInput) => Promise<void>;
  loading?: boolean;
}

export function CreateTeamUserDialog({ open, onClose, onCreate, loading }: CreateTeamUserDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<CreateTeamUserInput["role"]>("COLLECTOR");
  const [zone, setZone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(
    () => !firstName.trim() || !lastName.trim() || !email.trim() || loading,
    [email, firstName, lastName, loading],
  );

  if (!open) {
    return null;
  }

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }

    setError(null);
    await onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      zone: zone.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Team User"
      description="Add a user to this organization and assign their operational role."
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">First Name</label>
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Brian" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Name</label>
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Mwangi" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@ecoloop.co.ke"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254700000000" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</label>
            <Select value={role} onChange={(event) => setRole(event.target.value as CreateTeamUserInput["role"])}>
              <option value="ORG_ADMIN">Org Admin</option>
              <option value="COLLECTOR">Collector</option>
              <option value="PROCESSOR">Processor</option>
              <option value="BUYER">Buyer</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zone</label>
            <Input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Central" />
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} loading={loading} disabled={disabled}>Create User</Button>
        </div>
      </div>
    </Modal>
  );
}

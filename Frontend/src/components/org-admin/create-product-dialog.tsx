"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type CreateProductInput } from "@/types/org-admin";

interface CreateProductDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateProductInput) => Promise<void>;
  loading?: boolean;
}

export function CreateProductDialog({ open, onClose, onCreate, loading }: CreateProductDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CreateProductInput["category"]>("LARVAE");
  const [unit, setUnit] = useState<CreateProductInput["unit"]>("kg");
  const [price, setPrice] = useState("0");
  const [stockAvailable, setStockAvailable] = useState("0");
  const [status, setStatus] = useState<CreateProductInput["status"]>("ACTIVE");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => !name.trim() || loading, [name, loading]);

  if (!open) {
    return null;
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    setError(null);

    await onCreate({
      name: name.trim(),
      category,
      unit,
      price: Number(price) || 0,
      status,
      stockAvailable: Number(stockAvailable) || 0,
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Product" description="Add a catalog product for inventory and sales workflows.">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Premium BSF Larvae" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
            <Select value={category} onChange={(event) => setCategory(event.target.value as CreateProductInput["category"])}>
              <option value="LARVAE">Larvae</option>
              <option value="FERTILIZER">Fertilizer</option>
              <option value="PLASTIC_BRICKS">Plastic Bricks</option>
              <option value="GARDEN_STAKES">Garden Stakes</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit</label>
            <Select value={unit} onChange={(event) => setUnit(event.target.value as CreateProductInput["unit"])}>
              <option value="kg">kg</option>
              <option value="bag">bag</option>
              <option value="piece">piece</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</label>
            <Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} min={0} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stock</label>
            <Input type="number" value={stockAvailable} onChange={(event) => setStockAvailable(event.target.value)} min={0} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value as CreateProductInput["status"])}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short product summary" />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} loading={loading} disabled={disabled}>Create Product</Button>
        </div>
      </div>
    </Modal>
  );
}

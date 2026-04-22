"use client";

import { Globe } from "lucide-react";
import { useState } from "react";
import { SegmentedControl } from "@/components/org-admin/segmented-control";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";

export default function GeoPage() {
  const [tab, setTab] = useState<"ZONES" | "POINTS" | "CENTERS">("ZONES");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const geo = useAsyncResource(() => orgAdminService.getGeoData(), []);

  const createZoneAction = useAsyncAction((value: string) => orgAdminService.createZone(value));
  const createPointAction = useAsyncAction((value: string, selectedZone: string) =>
    orgAdminService.createCollectionPoint(value, selectedZone),
  );
  const createCenterAction = useAsyncAction((value: string, selectedZone: string) =>
    orgAdminService.createProcessingCenter(value, selectedZone),
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if ((tab === "POINTS" || tab === "CENTERS") && !zone.trim()) {
      setError("Zone is required.");
      return;
    }

    setError(null);

    if (tab === "ZONES") {
      await createZoneAction.execute(name);
    }

    if (tab === "POINTS") {
      await createPointAction.execute(name, zone);
    }

    if (tab === "CENTERS") {
      await createCenterAction.execute(name, zone);
    }

    setCreateOpen(false);
    setName("");
    setZone("");
    await geo.reload();
  };

  const query = search.trim().toLowerCase();

  const filteredZones = geo.data?.zones.filter((item) => !query || item.name.toLowerCase().includes(query)) ?? [];
  const filteredPoints =
    geo.data?.collectionPoints.filter(
      (item) => !query || item.name.toLowerCase().includes(query) || item.zone.toLowerCase().includes(query),
    ) ?? [];
  const filteredCenters =
    geo.data?.processingCenters.filter(
      (item) => !query || item.name.toLowerCase().includes(query) || item.zone.toLowerCase().includes(query),
    ) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Geo Structures"
        description="Organization geographies, collection points, and processing center administration."
        actions={<Button size="sm" onClick={() => setCreateOpen(true)}>Create {tab === "ZONES" ? "Zone" : tab === "POINTS" ? "Collection Point" : "Processing Center"}</Button>}
      />

      <SearchFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search geo entities"
        filters={<SegmentedControl value={tab} onChange={setTab} options={[{ label: "Zones", value: "ZONES" }, { label: "Collection Points", value: "POINTS" }, { label: "Processing Centers", value: "CENTERS" }]} />}
      />

      {geo.error ? <ErrorState message={geo.error} onRetry={() => void geo.reload()} /> : null}

      {geo.loading || !geo.data ? (
        <LoadingState rows={7} />
      ) : (
        <>
          {tab === "ZONES" ? (
            filteredZones.length === 0 ? (
              <EmptyState icon={Globe} title="No zones found" message="No zones match your search." />
            ) : (
              <DataTable headers={["Zone", "Collectors", "Status", "Actions"]}>
                {filteredZones.map((zoneItem) => (
                  <tr key={zoneItem.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{zoneItem.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{zoneItem.collectors}</td>
                    <td className="px-4 py-3"><StatusBadge status={zoneItem.status} /></td>
                    <td className="px-4 py-3"><Button variant="secondary" size="sm">Edit</Button></td>
                  </tr>
                ))}
              </DataTable>
            )
          ) : null}

          {tab === "POINTS" ? (
            filteredPoints.length === 0 ? (
              <EmptyState icon={Globe} title="No collection points found" message="No collection points match your search." />
            ) : (
              <DataTable headers={["Collection Point", "Zone", "Status", "Actions"]}>
                {filteredPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{point.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{point.zone}</td>
                    <td className="px-4 py-3"><StatusBadge status={point.status} /></td>
                    <td className="px-4 py-3"><Button variant="secondary" size="sm">Edit</Button></td>
                  </tr>
                ))}
              </DataTable>
            )
          ) : null}

          {tab === "CENTERS" ? (
            filteredCenters.length === 0 ? (
              <EmptyState icon={Globe} title="No processing centers found" message="No centers match your search." />
            ) : (
              <DataTable headers={["Processing Center", "Zone", "Status", "Actions"]}>
                {filteredCenters.map((center) => (
                  <tr key={center.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{center.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{center.zone}</td>
                    <td className="px-4 py-3"><StatusBadge status={center.status} /></td>
                    <td className="px-4 py-3"><Button variant="secondary" size="sm">Edit</Button></td>
                  </tr>
                ))}
              </DataTable>
            )
          ) : null}
        </>
      )}

      {createOpen ? (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title={`Create ${tab === "ZONES" ? "Zone" : tab === "POINTS" ? "Collection Point" : "Processing Center"}`}
          description="Add new geo structure for organization operations."
          className="max-w-md"
        >
          <div className="space-y-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
            {tab !== "ZONES" ? (
              <Select value={zone} onChange={(event) => setZone(event.target.value)}>
                <option value="">Select Zone</option>
                {geo.data?.zones.map((z) => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
              </Select>
            ) : null}

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => void handleCreate()} loading={createZoneAction.loading || createPointAction.loading || createCenterAction.loading}>Create</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Building2, Plus, ShieldUser } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { CreateOrgAdminDialog } from "@/components/platform/create-org-admin-dialog";
import { CreateOrganizationDialog } from "@/components/platform/create-organization-dialog";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { formatDate } from "@/lib/utils";
import {
  type CreateOrganizationAdminInput,
  type CreateOrganizationInput,
  type Organization,
  type OrganizationQuery,
} from "@/types/platform";

export default function OrganizationsPage() {
  const [query, setQuery] = useState<OrganizationQuery>({
    search: "",
    status: "ALL",
    createdWindow: "ALL",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [orgForAdmin, setOrgForAdmin] = useState<Organization | undefined>();
  const [orgForStatusToggle, setOrgForStatusToggle] = useState<Organization | undefined>();

  const resource = useAsyncResource(() => platformService.getOrganizations(query), [
    query.search,
    query.status,
    query.createdWindow,
  ]);

  const createOrganizationAction = useAsyncAction((payload: CreateOrganizationInput) =>
    platformService.createOrganization(payload),
  );
  const createOrgAdminAction = useAsyncAction((organizationId: string, payload: CreateOrganizationAdminInput) =>
    platformService.createOrganizationAdmin(organizationId, payload),
  );
  const toggleStatusAction = useAsyncAction((organizationId: string) =>
    platformService.toggleOrganizationStatus(organizationId),
  );

  const handleCreateOrganization = async (payload: Parameters<typeof platformService.createOrganization>[0]) => {
    await createOrganizationAction.execute(payload);
    setCreateOpen(false);
    await resource.reload();
  };

  const handleCreateOrgAdmin = async (payload: Parameters<typeof platformService.createOrganizationAdmin>[1]) => {
    if (!orgForAdmin) {
      return;
    }

    await createOrgAdminAction.execute(orgForAdmin.id, payload);
    setOrgForAdmin(undefined);
    await resource.reload();
  };

  const handleToggleStatus = async () => {
    if (!orgForStatusToggle) {
      return;
    }

    await toggleStatusAction.execute(orgForStatusToggle.id);
    setOrgForStatusToggle(undefined);
    await resource.reload();
  };

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Create, onboard, and govern tenant organizations at platform level."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        }
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search by name, slug, or description"
        filters={
          <>
            <Select
              value={query.status ?? "ALL"}
              onChange={(event) =>
                setQuery((prev) => ({
                  ...prev,
                  status: event.target.value as OrganizationQuery["status"],
                }))
              }
              className="w-[150px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DRAFT">Draft</option>
            </Select>

            <Select
              value={query.createdWindow ?? "ALL"}
              onChange={(event) =>
                setQuery((prev) => ({
                  ...prev,
                  createdWindow: event.target.value as OrganizationQuery["createdWindow"],
                }))
              }
              className="w-[150px]"
            >
              <option value="ALL">Any Date</option>
              <option value="7D">Last 7 days</option>
              <option value="30D">Last 30 days</option>
              <option value="90D">Last 90 days</option>
            </Select>
          </>
        }
      />

      {resource.error ? <ErrorState message={resource.error} onRetry={() => void resource.reload()} /> : null}

      {resource.loading || !resource.data ? (
        <LoadingState rows={6} />
      ) : resource.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          message="Try adjusting your filters or create a new organization to begin onboarding."
        />
      ) : (
        <DataTable
          headers={[
            "Organization",
            "Status",
            "Created",
            "Users",
            "Org Admin",
            "Readiness",
            "Actions",
          ]}
        >
          {resource.data.map((organization) => (
            <tr key={organization.id} className="hover:bg-surface-soft/60">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{organization.name}</p>
                <p className="text-xs text-muted-foreground">{organization.slug}</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={organization.status} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(organization.createdAt)}</td>
              <td className="px-4 py-3 text-sm text-foreground">{organization.userCount}</td>
              <td className="px-4 py-3 text-sm">
                {organization.hasOrgAdmin ? (
                  <span className="status-dot text-[#11643c]">Configured</span>
                ) : (
                  <span className="status-dot text-[#9c5a03]">Missing</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="min-w-[120px]">
                  <p className="text-xs text-muted-foreground">{organization.readinessScore}%</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-surface-soft">
                    <div className="h-1.5 rounded-full bg-brand" style={{ width: `${organization.readinessScore}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/organizations/${organization.id}`}>
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOrgForAdmin(organization)}
                    disabled={organization.hasOrgAdmin}
                  >
                    <ShieldUser className="h-4 w-4" />
                    {organization.hasOrgAdmin ? "Admin Ready" : "Create Admin"}
                  </Button>
                  <Button
                    variant={organization.status === "SUSPENDED" ? "secondary" : "danger"}
                    size="sm"
                    onClick={() => setOrgForStatusToggle(organization)}
                  >
                    {organization.status === "SUSPENDED" ? "Activate" : "Suspend"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {createOpen ? (
        <CreateOrganizationDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateOrganization}
          loading={createOrganizationAction.loading}
        />
      ) : null}

      {orgForAdmin ? (
        <CreateOrgAdminDialog
          open={Boolean(orgForAdmin)}
          organization={orgForAdmin}
          onClose={() => setOrgForAdmin(undefined)}
          onCreate={handleCreateOrgAdmin}
          loading={createOrgAdminAction.loading}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(orgForStatusToggle)}
        title={
          orgForStatusToggle?.status === "SUSPENDED"
            ? "Reactivate organization?"
            : "Suspend organization?"
        }
        message={
          orgForStatusToggle?.status === "SUSPENDED"
            ? "This tenant will regain full platform access."
            : "This tenant and its users will lose operational access until reactivated."
        }
        confirmLabel={orgForStatusToggle?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        onClose={() => setOrgForStatusToggle(undefined)}
        onConfirm={handleToggleStatus}
        loading={toggleStatusAction.loading}
        danger={orgForStatusToggle?.status !== "SUSPENDED"}
      />
    </div>
  );
}

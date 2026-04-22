"use client";

import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/platform/confirm-dialog";
import { DataTable } from "@/components/platform/data-table";
import { EmptyState } from "@/components/platform/empty-state";
import { ErrorState } from "@/components/platform/error-state";
import { LoadingState } from "@/components/platform/loading-state";
import { PageHeader } from "@/components/platform/page-header";
import { SearchFilterToolbar } from "@/components/platform/search-filter-toolbar";
import { StatusBadge } from "@/components/platform/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CreateTeamUserDialog } from "@/components/org-admin/create-team-user-dialog";
import { RoleBadge } from "@/components/org-admin/role-badge";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { orgAdminService } from "@/lib/services/org-admin-service";
import { formatDate, formatDateTime } from "@/lib/utils";
import { type CreateTeamUserInput, type OrgTeamUser, type TeamQuery } from "@/types/org-admin";
import { useState } from "react";

export default function OrgAdminTeamPage() {
  const [query, setQuery] = useState<TeamQuery>({ search: "", role: "ALL", status: "ALL" });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrgTeamUser | undefined>();

  const users = useAsyncResource(() => orgAdminService.getTeamUsers(query), [query.search, query.role, query.status]);
  const createAction = useAsyncAction((payload: CreateTeamUserInput) =>
    orgAdminService.createTeamUser(payload),
  );
  const toggleStatusAction = useAsyncAction((userId: string) => orgAdminService.toggleTeamUserStatus(userId));

  const handleCreateUser = async (payload: Parameters<typeof orgAdminService.createTeamUser>[0]) => {
    await createAction.execute(payload);
    setCreateOpen(false);
    await users.reload();
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) {
      return;
    }

    await toggleStatusAction.execute(selectedUser.id);
    setSelectedUser(undefined);
    await users.reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team"
        description="Manage organization members, role assignments, and workforce account state."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        }
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search team by name, email, zone"
        filters={
          <>
            <Select
              value={query.role ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, role: event.target.value as TeamQuery["role"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Roles</option>
              <option value="ORG_ADMIN">Org Admin</option>
              <option value="COLLECTOR">Collector</option>
              <option value="PROCESSOR">Processor</option>
              <option value="BUYER">Buyer</option>
            </Select>

            <Select
              value={query.status ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value as TeamQuery["status"] }))}
              className="w-[170px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INVITED">Invited</option>
            </Select>
          </>
        }
      />

      {users.error ? <ErrorState message={users.error} onRetry={() => void users.reload()} /> : null}

      {users.loading || !users.data ? (
        <LoadingState rows={7} />
      ) : users.data.length === 0 ? (
        <EmptyState icon={Users} title="No team users found" message="Adjust filters or create your first org user." />
      ) : (
        <DataTable headers={["User", "Role", "Status", "Zone/Assignment", "Joined", "Last Active", "Actions"]}>
          {users.data.map((user) => (
            <tr key={user.id} className="hover:bg-surface-soft/60">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </td>
              <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
              <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
              <td className="px-4 py-3">
                <p className="text-sm text-foreground">{user.zone ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{user.assignment ?? "-"}</p>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.joinedAt)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{user.lastActiveAt ? formatDateTime(user.lastActiveAt) : "-"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/org-admin/team/${user.id}`}>
                    <Button size="sm" variant="secondary">View</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={user.status === "SUSPENDED" ? "secondary" : "danger"}
                    onClick={() => setSelectedUser(user)}
                    disabled={user.role === "ORG_ADMIN"}
                  >
                    {user.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {createOpen ? (
        <CreateTeamUserDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateUser} loading={createAction.loading} />
      ) : null}

      <ConfirmDialog
        open={Boolean(selectedUser)}
        title={selectedUser?.status === "SUSPENDED" ? "Reactivate user?" : "Suspend user?"}
        message={selectedUser?.status === "SUSPENDED" ? "User account access will be restored." : "User access and workflows will be paused until reactivated."}
        confirmLabel={selectedUser?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        onConfirm={handleToggleStatus}
        onClose={() => setSelectedUser(undefined)}
        loading={toggleStatusAction.loading}
        danger={selectedUser?.status !== "SUSPENDED"}
      />
    </div>
  );
}

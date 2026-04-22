"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { useState } from "react";
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
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { platformService } from "@/lib/services/platform-service";
import { formatDate, formatDateTime, roleLabel } from "@/lib/utils";
import { type PlatformUser, type UsersQuery } from "@/types/platform";

export default function PlatformUsersPage() {
  const [query, setQuery] = useState<UsersQuery>({
    search: "",
    role: "ALL",
    status: "ALL",
    organizationId: "ALL",
  });
  const [selectedUser, setSelectedUser] = useState<PlatformUser | undefined>();

  const organizationsResource = useAsyncResource(() => platformService.listOrganizationsForFilter(), []);
  const usersResource = useAsyncResource(() => platformService.getPlatformUsers(query), [
    query.search,
    query.role,
    query.status,
    query.organizationId,
  ]);

  const toggleStatusAction = useAsyncAction((userId: string) => platformService.toggleUserStatus(userId));

  const handleToggleStatus = async () => {
    if (!selectedUser) {
      return;
    }

    await toggleStatusAction.execute(selectedUser.id);
    setSelectedUser(undefined);
    await usersResource.reload();
  };

  return (
    <div>
      <PageHeader
        title="Platform Users"
        description="Platform-wide user governance with role and account-state controls."
      />

      <SearchFilterToolbar
        searchValue={query.search ?? ""}
        onSearchChange={(value) => setQuery((prev) => ({ ...prev, search: value }))}
        searchPlaceholder="Search users by name, email, or organization"
        filters={
          <>
            <Select
              value={query.role ?? "ALL"}
              onChange={(event) => setQuery((prev) => ({ ...prev, role: event.target.value as UsersQuery["role"] }))}
              className="w-[160px]"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ORG_ADMIN">Org Admin</option>
              <option value="COLLECTOR">Collector</option>
              <option value="PROCESSOR">Processor</option>
              <option value="BUYER">Buyer</option>
            </Select>

            <Select
              value={query.status ?? "ALL"}
              onChange={(event) =>
                setQuery((prev) => ({
                  ...prev,
                  status: event.target.value as UsersQuery["status"],
                }))
              }
              className="w-[160px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INVITED">Invited</option>
            </Select>

            <Select
              value={query.organizationId ?? "ALL"}
              onChange={(event) =>
                setQuery((prev) => ({
                  ...prev,
                  organizationId: event.target.value as UsersQuery["organizationId"],
                }))
              }
              className="w-[180px]"
            >
              <option value="ALL">All Organizations</option>
              {(organizationsResource.data ?? []).map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {usersResource.error ? <ErrorState message={usersResource.error} onRetry={() => void usersResource.reload()} /> : null}

      {usersResource.loading || !usersResource.data ? (
        <LoadingState rows={6} />
      ) : usersResource.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          message="Update your filters or create org admins from organization management flows."
        />
      ) : (
        <DataTable
          headers={[
            "User",
            "Role",
            "Organization",
            "Status",
            "Created",
            "Last Active",
            "Actions",
          ]}
        >
          {usersResource.data.map((user) => (
            <tr key={user.id} className="hover:bg-surface-soft/60">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{roleLabel(user.role)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{user.organizationName ?? "Platform"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/users/${user.id}`}>
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </Link>
                  <Button
                    variant={user.status === "SUSPENDED" ? "secondary" : "danger"}
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                    disabled={user.role === "SUPER_ADMIN"}
                  >
                    {user.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ConfirmDialog
        open={Boolean(selectedUser)}
        title={selectedUser?.status === "SUSPENDED" ? "Reactivate account?" : "Suspend account?"}
        message={
          selectedUser?.status === "SUSPENDED"
            ? "User will regain access immediately."
            : "User access will be blocked until manually reactivated."
        }
        confirmLabel={selectedUser?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
        onClose={() => setSelectedUser(undefined)}
        onConfirm={handleToggleStatus}
        loading={toggleStatusAction.loading}
        danger={selectedUser?.status !== "SUSPENDED"}
      />
    </div>
  );
}

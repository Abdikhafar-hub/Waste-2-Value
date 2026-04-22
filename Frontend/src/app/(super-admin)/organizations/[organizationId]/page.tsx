import { OrganizationDetailView } from "./organization-detail-view";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return <OrganizationDetailView organizationId={organizationId} />;
}

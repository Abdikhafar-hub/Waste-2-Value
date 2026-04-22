import { UserDetailView } from "./user-detail-view";

export default async function PlatformUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <UserDetailView userId={userId} />;
}

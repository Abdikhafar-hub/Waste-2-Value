import { TeamUserDetailView } from "./team-user-detail-view";

export default async function TeamUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <TeamUserDetailView userId={userId} />;
}

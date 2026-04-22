import { WasteDetailView } from "./waste-detail-view";

export default async function WasteDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  return <WasteDetailView submissionId={submissionId} />;
}

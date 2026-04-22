import { AssignmentDetailView } from "./assignment-detail-view";

export default async function ProcessorAssignmentDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <AssignmentDetailView submissionId={submissionId} />;
}

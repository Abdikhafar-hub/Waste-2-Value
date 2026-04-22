import { SubmissionDetailView } from "./submission-detail-view";

export default async function CollectorSubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <SubmissionDetailView submissionId={submissionId} />;
}

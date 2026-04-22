import { BatchDetailView } from "./batch-detail-view";

export default async function ProcessorBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return <BatchDetailView batchId={batchId} />;
}

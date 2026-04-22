import { CreateBatchView } from "./create-batch-view";

export default async function CreateBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ assignmentId?: string }>;
}) {
  const { assignmentId } = await searchParams;
  return <CreateBatchView preselectedAssignmentId={assignmentId} />;
}

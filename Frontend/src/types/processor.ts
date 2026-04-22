export type ProcessorWasteType = "ORGANIC" | "PLASTIC";

export type ProcessorAssignmentStatus =
  | "AWAITING_RECEIPT"
  | "RECEIVED"
  | "IN_PROCESSING"
  | "PROCESSED";

export type ProcessorBatchStatus = "DRAFT" | "ACTIVE" | "COMPLETED";

export type ProcessorOutputType =
  | "LARVAE"
  | "FERTILIZER"
  | "PLASTIC_BRICKS"
  | "GARDEN_STAKES";

export type ProcessorOutputUnit = "kg" | "bag" | "piece";

export interface ProcessorTimelineItem {
  id: string;
  title: string;
  at: string;
  status: string;
  actor: string;
  note?: string;
}

export interface ProcessorHistoryItem {
  id: string;
  action: string;
  at: string;
  actor: string;
  details: string;
}

export interface ProcessorAssignment {
  id: string;
  reference: string;
  collectorName: string;
  wasteType: ProcessorWasteType;
  weightKg: number;
  zone: string;
  processingCenter: string;
  collectionPoint?: string;
  tagCode?: string;
  notes?: string;
  assignedAt: string;
  status: ProcessorAssignmentStatus;
  processorName: string;
  timeline: ProcessorTimelineItem[];
  history: ProcessorHistoryItem[];
}

export interface ProcessorBatchOutput {
  id: string;
  outputType: ProcessorOutputType;
  quantity: number;
  unit: ProcessorOutputUnit;
  notes?: string;
  recordedAt: string;
}

export interface ProcessorBatch {
  id: string;
  reference: string;
  wasteType: ProcessorWasteType;
  inputWeightKg: number;
  processingCenter: string;
  processorName: string;
  assignmentIds: string[];
  inputReferences: string[];
  outputs: ProcessorBatchOutput[];
  status: ProcessorBatchStatus;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  timeline: ProcessorTimelineItem[];
  history: ProcessorHistoryItem[];
}

export interface ProcessorDashboardData {
  profile: {
    firstName: string;
    organizationName: string;
  };
  metrics: {
    assignedCount: number;
    awaitingReceipt: number;
    inProcessing: number;
    completedBatches: number;
    outputsProduced: number;
    creditsEarned: number;
  };
  recentAssignments: ProcessorAssignment[];
  activeBatches: ProcessorBatch[];
}

export interface ProcessorAssignmentQuery {
  search?: string;
  status?: ProcessorAssignmentStatus | "ALL";
  wasteType?: ProcessorWasteType | "ALL";
  zone?: string | "ALL";
  processingCenter?: string | "ALL";
}

export interface ProcessorBatchQuery {
  search?: string;
  status?: ProcessorBatchStatus | "ALL";
  wasteType?: ProcessorWasteType | "ALL";
}

export interface CreateProcessorBatchInput {
  assignmentIds: string[];
  processingCenter: string;
  notes?: string;
}

export interface RecordProcessorOutputInput {
  outputType: ProcessorOutputType;
  quantity: number;
  unit: ProcessorOutputUnit;
  notes?: string;
}

export interface ProcessorBatchCreationMeta {
  eligibleAssignments: ProcessorAssignment[];
  processingCenters: string[];
}

export interface ProcessorWalletTransaction {
  id: string;
  type: "CREDIT_EARNED" | "REDEMPTION_REQUESTED" | "REDEMPTION_APPROVED" | "REDEMPTION_REJECTED";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  context: string;
  reference?: string;
  createdAt: string;
}

export interface ProcessorRedemptionRequest {
  id: string;
  amount: number;
  requestedItem: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string;
  createdAt: string;
}

export interface ProcessorWalletData {
  balance: number;
  totalEarned: number;
  pendingRedemptions: number;
  transactions: ProcessorWalletTransaction[];
  redemptions: ProcessorRedemptionRequest[];
}

export interface CreateProcessorRedemptionInput {
  amount: number;
  requestedItem: string;
  notes?: string;
}

export interface ProcessorPerformanceData {
  completedBatches: number;
  processedSubmissions: number;
  totalOutputQuantity: number;
  creditsEarned: number;
  reliabilityScore: number;
  processingStreak: number;
  weeklyProduction: Array<{
    label: string;
    batches: number;
    outputs: number;
  }>;
  insights: string[];
}

export interface ProcessorAccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "PROCESSOR";
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  organizationName: string;
  processingCenter: string;
  joinedAt: string;
  lastActiveAt: string;
}

export interface ProcessorFilterMeta {
  zones: string[];
  processingCenters: string[];
}

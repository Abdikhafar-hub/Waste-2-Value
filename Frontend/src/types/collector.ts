export type CollectorWasteType = "ORGANIC" | "PLASTIC";

export type CollectorSubmissionStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ASSIGNED"
  | "IN_PROCESSING"
  | "PROCESSED";

export interface CollectorSubmissionTimelineItem {
  id: string;
  title: string;
  description?: string;
  status: CollectorSubmissionStatus;
  at: string;
}

export interface CollectorSubmission {
  id: string;
  reference: string;
  wasteType: CollectorWasteType;
  weightKg: number;
  zone: string;
  collectionPoint?: string;
  tagCode?: string;
  notes?: string;
  submittedAt: string;
  status: CollectorSubmissionStatus;
  assignedProcessorName?: string;
  reviewFeedback?: string;
  timeline: CollectorSubmissionTimelineItem[];
}

export interface CollectorDashboardData {
  profile: {
    firstName: string;
    organizationName: string;
  };
  kpis: {
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    creditsEarned: number;
  };
  statusSummary: Array<{
    status: CollectorSubmissionStatus;
    value: number;
  }>;
  recentSubmissions: CollectorSubmission[];
  streakDays: number;
}

export interface CollectorSubmissionQuery {
  search?: string;
  status?: CollectorSubmissionStatus | "ALL";
  wasteType?: CollectorWasteType | "ALL";
  dateWindow?: "ALL" | "7D" | "30D";
}

export interface CreateCollectorSubmissionInput {
  wasteType: CollectorWasteType;
  weightKg: number;
  zone: string;
  collectionPoint?: string;
  tagCode?: string;
  notes?: string;
}

export interface CollectorWalletTransaction {
  id: string;
  type: "CREDIT_EARNED" | "REDEMPTION_REQUESTED" | "REDEMPTION_APPROVED" | "REDEMPTION_REJECTED";
  amount: number;
  reference?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  context: string;
  createdAt: string;
}

export interface CollectorRedemptionRequest {
  id: string;
  amount: number;
  requestedItem: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface CollectorWalletData {
  balance: number;
  totalEarned: number;
  pendingRedemptions: number;
  transactions: CollectorWalletTransaction[];
  redemptions: CollectorRedemptionRequest[];
}

export interface CreateCollectorRedemptionInput {
  amount: number;
  requestedItem: string;
  notes?: string;
}

export interface CollectorReputationData {
  reliabilityScore: number;
  approvalRate: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  creditsEarned: number;
  insights: string[];
  weeklyPerformance: Array<{
    label: string;
    approved: number;
    rejected: number;
  }>;
}

export interface CollectorAccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "COLLECTOR";
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  organizationName: string;
  zone: string;
  joinedAt: string;
  lastActiveAt: string;
}

export interface CollectorSubmissionFormMeta {
  zones: string[];
  collectionPoints: string[];
}

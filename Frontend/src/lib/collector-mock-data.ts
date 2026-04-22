import {
  type CollectorAccountProfile,
  type CollectorRedemptionRequest,
  type CollectorSubmission,
  type CollectorWalletTransaction,
} from "@/types/collector";

export const collectorProfileSeed: CollectorAccountProfile = {
  id: "collector_001",
  firstName: "Brian",
  lastName: "Mwangi",
  email: "brian.collector@ecoloop.co.ke",
  phone: "+254712991100",
  role: "COLLECTOR",
  status: "ACTIVE",
  organizationName: "EcoLoop Nairobi",
  zone: "Central",
  joinedAt: "2026-03-17T08:45:00.000Z",
  lastActiveAt: "2026-04-22T09:20:00.000Z",
};

export const collectorSubmissionsSeed: CollectorSubmission[] = [
  {
    id: "csub_001",
    reference: "W2V-CL-2401",
    wasteType: "ORGANIC",
    weightKg: 245,
    zone: "Central",
    collectionPoint: "Kenyatta Market Hub",
    tagCode: "TAG-8834",
    notes: "Morning route, sorted source bags.",
    submittedAt: "2026-04-22T06:10:00.000Z",
    status: "ASSIGNED",
    assignedProcessorName: "James Kariuki",
    timeline: [
      {
        id: "ctl_001",
        title: "Submitted",
        description: "Submission received by organization queue.",
        status: "SUBMITTED",
        at: "2026-04-22T06:10:00.000Z",
      },
      {
        id: "ctl_002",
        title: "Under Review",
        description: "Quality and contamination checks in progress.",
        status: "UNDER_REVIEW",
        at: "2026-04-22T06:31:00.000Z",
      },
      {
        id: "ctl_003",
        title: "Approved",
        description: "Approved by org admin.",
        status: "APPROVED",
        at: "2026-04-22T06:44:00.000Z",
      },
      {
        id: "ctl_004",
        title: "Assigned",
        description: "Assigned to processor line A.",
        status: "ASSIGNED",
        at: "2026-04-22T07:02:00.000Z",
      },
    ],
  },
  {
    id: "csub_002",
    reference: "W2V-CL-2395",
    wasteType: "PLASTIC",
    weightKg: 118,
    zone: "Central",
    collectionPoint: "City Route Point 3",
    notes: "Mostly PET and HDPE mix.",
    submittedAt: "2026-04-21T15:18:00.000Z",
    status: "UNDER_REVIEW",
    timeline: [
      {
        id: "ctl_005",
        title: "Submitted",
        status: "SUBMITTED",
        at: "2026-04-21T15:18:00.000Z",
      },
      {
        id: "ctl_006",
        title: "Under Review",
        description: "Awaiting verification by operations team.",
        status: "UNDER_REVIEW",
        at: "2026-04-21T15:42:00.000Z",
      },
    ],
  },
  {
    id: "csub_003",
    reference: "W2V-CL-2389",
    wasteType: "ORGANIC",
    weightKg: 210,
    zone: "Central",
    collectionPoint: "Railway Yard Point",
    tagCode: "TAG-8701",
    submittedAt: "2026-04-20T10:44:00.000Z",
    status: "PROCESSED",
    assignedProcessorName: "Mercy Njeri",
    timeline: [
      { id: "ctl_007", title: "Submitted", status: "SUBMITTED", at: "2026-04-20T10:44:00.000Z" },
      { id: "ctl_008", title: "Approved", status: "APPROVED", at: "2026-04-20T11:04:00.000Z" },
      { id: "ctl_009", title: "In Processing", status: "IN_PROCESSING", at: "2026-04-20T12:10:00.000Z" },
      { id: "ctl_010", title: "Processed", status: "PROCESSED", at: "2026-04-20T16:41:00.000Z" },
    ],
  },
  {
    id: "csub_004",
    reference: "W2V-CL-2384",
    wasteType: "PLASTIC",
    weightKg: 92,
    zone: "Central",
    collectionPoint: "Upperhill Point",
    submittedAt: "2026-04-19T13:21:00.000Z",
    status: "REJECTED",
    reviewFeedback: "Mixed with non-recyclable residue. Please improve sorting.",
    timeline: [
      { id: "ctl_011", title: "Submitted", status: "SUBMITTED", at: "2026-04-19T13:21:00.000Z" },
      { id: "ctl_012", title: "Under Review", status: "UNDER_REVIEW", at: "2026-04-19T13:40:00.000Z" },
      {
        id: "ctl_013",
        title: "Rejected",
        description: "Rejected due to contamination threshold.",
        status: "REJECTED",
        at: "2026-04-19T13:52:00.000Z",
      },
    ],
  },
  {
    id: "csub_005",
    reference: "W2V-CL-2380",
    wasteType: "ORGANIC",
    weightKg: 168,
    zone: "Central",
    collectionPoint: "Kariokor Point",
    submittedAt: "2026-04-18T08:15:00.000Z",
    status: "APPROVED",
    timeline: [
      { id: "ctl_014", title: "Submitted", status: "SUBMITTED", at: "2026-04-18T08:15:00.000Z" },
      { id: "ctl_015", title: "Approved", status: "APPROVED", at: "2026-04-18T08:52:00.000Z" },
    ],
  },
];

export const collectorWalletTransactionsSeed: CollectorWalletTransaction[] = [
  {
    id: "ctx_001",
    type: "CREDIT_EARNED",
    amount: 160,
    reference: "W2V-CL-2401",
    status: "SUCCESS",
    context: "Credits from approved organic submission",
    createdAt: "2026-04-22T07:05:00.000Z",
  },
  {
    id: "ctx_002",
    type: "CREDIT_EARNED",
    amount: 120,
    reference: "W2V-CL-2398",
    status: "SUCCESS",
    context: "Credits from approved plastic submission",
    createdAt: "2026-04-21T12:00:00.000Z",
  },
  {
    id: "ctx_003",
    type: "REDEMPTION_REQUESTED",
    amount: -300,
    status: "PENDING",
    context: "Mobile airtime redemption request",
    createdAt: "2026-04-20T16:24:00.000Z",
  },
  {
    id: "ctx_004",
    type: "REDEMPTION_APPROVED",
    amount: -260,
    status: "SUCCESS",
    context: "Cash payout redemption approved",
    createdAt: "2026-04-18T14:11:00.000Z",
  },
  {
    id: "ctx_005",
    type: "REDEMPTION_REJECTED",
    amount: 0,
    status: "FAILED",
    context: "Rejected request due to duplicate claim",
    createdAt: "2026-04-15T09:40:00.000Z",
  },
];

export const collectorRedemptionsSeed: CollectorRedemptionRequest[] = [
  {
    id: "cred_001",
    amount: 300,
    requestedItem: "Mobile airtime",
    notes: "Safaricom bundle",
    status: "PENDING",
    createdAt: "2026-04-20T16:24:00.000Z",
  },
  {
    id: "cred_002",
    amount: 260,
    requestedItem: "Cash payout",
    status: "APPROVED",
    createdAt: "2026-04-18T11:02:00.000Z",
  },
];

export const collectorZonesSeed = ["Central", "Eastlands", "Westlands"];

export const collectorCollectionPointsSeed = [
  "Kenyatta Market Hub",
  "City Route Point 3",
  "Railway Yard Point",
  "Upperhill Point",
  "Kariokor Point",
];

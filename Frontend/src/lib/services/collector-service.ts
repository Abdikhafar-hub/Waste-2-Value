import { simulateNetwork } from "@/lib/api/client";
import {
  collectorCollectionPointsSeed,
  collectorProfileSeed,
  collectorRedemptionsSeed,
  collectorSubmissionsSeed,
  collectorWalletTransactionsSeed,
  collectorZonesSeed,
} from "@/lib/collector-mock-data";
import {
  type CollectorAccountProfile,
  type CollectorDashboardData,
  type CollectorReputationData,
  type CollectorSubmission,
  type CollectorSubmissionFormMeta,
  type CollectorSubmissionQuery,
  type CollectorWalletData,
  type CreateCollectorRedemptionInput,
  type CreateCollectorSubmissionInput,
} from "@/types/collector";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function createId(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

function createSubmissionReference() {
  const stamp = Math.floor(2300 + Math.random() * 800);
  return `W2V-CL-${stamp}`;
}

function withinDateWindow(value: string, window: "ALL" | "7D" | "30D") {
  if (window === "ALL") {
    return true;
  }

  const createdAt = new Date(value).getTime();
  const now = Date.now();
  const windowDays = window === "7D" ? 7 : 30;
  return now - createdAt <= windowDays * 24 * 60 * 60 * 1000;
}

class CollectorService {
  private submissions = clone(collectorSubmissionsSeed);

  private walletTransactions = clone(collectorWalletTransactionsSeed);

  private redemptionRequests = clone(collectorRedemptionsSeed);

  async getDashboardData(): Promise<CollectorDashboardData> {
    const totalSubmissions = this.submissions.length;
    const pendingSubmissions = this.submissions.filter(
      (item) => item.status === "SUBMITTED" || item.status === "UNDER_REVIEW",
    ).length;
    const approvedSubmissions = this.submissions.filter((item) => item.status === "APPROVED" || item.status === "PROCESSED").length;
    const creditsEarned = this.walletTransactions
      .filter((item) => item.type === "CREDIT_EARNED" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const recentSubmissions = [...this.submissions]
      .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
      .slice(0, 5);

    const streakDays = this.calculateSubmissionStreak();

    return simulateNetwork({
      profile: {
        firstName: collectorProfileSeed.firstName,
        organizationName: collectorProfileSeed.organizationName,
      },
      kpis: {
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        creditsEarned,
      },
      statusSummary: [
        { status: "SUBMITTED", value: this.countByStatus("SUBMITTED") },
        { status: "UNDER_REVIEW", value: this.countByStatus("UNDER_REVIEW") },
        { status: "APPROVED", value: this.countByStatus("APPROVED") },
        { status: "REJECTED", value: this.countByStatus("REJECTED") },
        { status: "IN_PROCESSING", value: this.countByStatus("IN_PROCESSING") },
        { status: "PROCESSED", value: this.countByStatus("PROCESSED") },
      ],
      recentSubmissions,
      streakDays,
    });
  }

  async getSubmissions(query?: CollectorSubmissionQuery): Promise<CollectorSubmission[]> {
    const search = normalize(query?.search ?? "");
    const status = query?.status ?? "ALL";
    const wasteType = query?.wasteType ?? "ALL";
    const dateWindow = query?.dateWindow ?? "ALL";

    const filtered = this.submissions.filter((submission) => {
      const matchesSearch =
        !search ||
        normalize(submission.reference).includes(search) ||
        normalize(submission.zone).includes(search) ||
        normalize(submission.collectionPoint ?? "").includes(search);
      const matchesStatus = status === "ALL" || submission.status === status;
      const matchesType = wasteType === "ALL" || submission.wasteType === wasteType;
      const matchesDate = withinDateWindow(submission.submittedAt, dateWindow);

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    filtered.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));

    return simulateNetwork(clone(filtered));
  }

  async getSubmissionById(submissionId: string): Promise<CollectorSubmission> {
    const found = this.submissions.find((item) => item.id === submissionId);
    if (!found) {
      throw new Error("Submission not found.");
    }

    return simulateNetwork(clone(found));
  }

  async getSubmissionFormMeta(): Promise<CollectorSubmissionFormMeta> {
    return simulateNetwork({
      zones: clone(collectorZonesSeed),
      collectionPoints: clone(collectorCollectionPointsSeed),
    });
  }

  async createSubmission(payload: CreateCollectorSubmissionInput): Promise<CollectorSubmission> {
    if (!payload.wasteType || !payload.zone || payload.weightKg <= 0) {
      throw new Error("Waste type, weight, and zone are required.");
    }

    const now = new Date().toISOString();

    const submission: CollectorSubmission = {
      id: createId("csub"),
      reference: createSubmissionReference(),
      wasteType: payload.wasteType,
      weightKg: payload.weightKg,
      zone: payload.zone,
      collectionPoint: payload.collectionPoint,
      tagCode: payload.tagCode,
      notes: payload.notes,
      submittedAt: now,
      status: "SUBMITTED",
      timeline: [
        {
          id: createId("ctl"),
          title: "Submitted",
          description: "Submission sent to organization review queue.",
          status: "SUBMITTED",
          at: now,
        },
      ],
    };

    this.submissions.unshift(submission);

    return simulateNetwork(clone(submission));
  }

  async getWalletData(): Promise<CollectorWalletData> {
    const totalEarned = this.walletTransactions
      .filter((item) => item.type === "CREDIT_EARNED" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const redeemed = this.walletTransactions
      .filter((item) => item.amount < 0 && item.status === "SUCCESS")
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const pendingRedemptions = this.redemptionRequests.filter((item) => item.status === "PENDING").length;

    return simulateNetwork({
      balance: Math.max(0, totalEarned - redeemed),
      totalEarned,
      pendingRedemptions,
      transactions: clone(this.walletTransactions).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      redemptions: clone(this.redemptionRequests).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    });
  }

  async requestRedemption(payload: CreateCollectorRedemptionInput) {
    if (payload.amount <= 0 || !payload.requestedItem.trim()) {
      throw new Error("Requested amount and item are required.");
    }

    const now = new Date().toISOString();

    const request = {
      id: createId("cred"),
      amount: payload.amount,
      requestedItem: payload.requestedItem.trim(),
      notes: payload.notes?.trim(),
      status: "PENDING" as const,
      createdAt: now,
    };

    this.redemptionRequests.unshift(request);

    this.walletTransactions.unshift({
      id: createId("ctx"),
      type: "REDEMPTION_REQUESTED",
      amount: -Math.abs(payload.amount),
      status: "PENDING",
      context: `Redemption requested for ${request.requestedItem}`,
      createdAt: now,
    });

    return simulateNetwork(clone(request));
  }

  async getReputationData(): Promise<CollectorReputationData> {
    const totalSubmissions = this.submissions.length;
    const approvedSubmissions = this.submissions.filter((item) => item.status === "APPROVED" || item.status === "PROCESSED").length;
    const rejectedSubmissions = this.submissions.filter((item) => item.status === "REJECTED").length;

    const reviewed = approvedSubmissions + rejectedSubmissions;
    const approvalRate = reviewed > 0 ? Math.round((approvedSubmissions / reviewed) * 100) : 0;

    const creditsEarned = this.walletTransactions
      .filter((item) => item.type === "CREDIT_EARNED" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const reliabilityScore = Math.min(100, Math.round(approvalRate * 0.72 + this.calculateSubmissionStreak() * 2.6));

    return simulateNetwork({
      reliabilityScore,
      approvalRate,
      totalSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      creditsEarned,
      insights: [
        "Your submission quality is improving week by week.",
        "Keep tagging sorted batches to speed up approval.",
        "Consistent daily submissions boost reliability score.",
      ],
      weeklyPerformance: [
        { label: "Week 1", approved: 5, rejected: 1 },
        { label: "Week 2", approved: 6, rejected: 1 },
        { label: "Week 3", approved: 7, rejected: 2 },
        { label: "Week 4", approved: 9, rejected: 1 },
      ],
    });
  }

  async getAccountProfile(): Promise<CollectorAccountProfile> {
    return simulateNetwork(clone(collectorProfileSeed));
  }

  private countByStatus(status: CollectorSubmission["status"]) {
    return this.submissions.filter((item) => item.status === status).length;
  }

  private calculateSubmissionStreak() {
    const days = Array.from(
      new Set(
        this.submissions.map((submission) =>
          new Date(submission.submittedAt).toISOString().slice(0, 10),
        ),
      ),
    ).sort((a, b) => +new Date(b) - +new Date(a));

    if (days.length === 0) {
      return 0;
    }

    let streak = 1;
    for (let index = 1; index < days.length; index += 1) {
      const prev = new Date(days[index - 1]);
      const current = new Date(days[index]);
      const diffDays = Math.round((prev.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const collectorService = new CollectorService();

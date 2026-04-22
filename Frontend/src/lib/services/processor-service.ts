import { simulateNetwork } from "@/lib/api/client";
import {
  processorAssignmentsSeed,
  processorBatchesSeed,
  processorCentersSeed,
  processorPerformanceSeed,
  processorProfileSeed,
  processorRedemptionRequestsSeed,
  processorWalletTransactionsSeed,
  processorZonesSeed,
} from "@/lib/processor-mock-data";
import {
  type CreateProcessorBatchInput,
  type CreateProcessorRedemptionInput,
  type ProcessorAccountProfile,
  type ProcessorAssignment,
  type ProcessorAssignmentQuery,
  type ProcessorBatch,
  type ProcessorBatchCreationMeta,
  type ProcessorBatchQuery,
  type ProcessorDashboardData,
  type ProcessorFilterMeta,
  type ProcessorPerformanceData,
  type ProcessorRedemptionRequest,
  type ProcessorWalletData,
  type RecordProcessorOutputInput,
} from "@/types/processor";

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

function createBatchRef() {
  const random = Math.floor(900 + Math.random() * 120);
  return `BCH-${random}`;
}

class ProcessorService {
  private assignments = clone(processorAssignmentsSeed);

  private batches = clone(processorBatchesSeed);

  private walletTransactions = clone(processorWalletTransactionsSeed);

  private redemptionRequests = clone(processorRedemptionRequestsSeed);

  private performance = clone(processorPerformanceSeed);

  async getDashboardData(): Promise<ProcessorDashboardData> {
    const assignedCount = this.assignments.length;
    const awaitingReceipt = this.assignments.filter((item) => item.status === "AWAITING_RECEIPT").length;
    const inProcessing = this.assignments.filter((item) => item.status === "IN_PROCESSING").length;
    const completedBatches = this.batches.filter((item) => item.status === "COMPLETED").length;
    const outputsProduced = this.batches.reduce(
      (sum, batch) => sum + batch.outputs.reduce((inner, output) => inner + output.quantity, 0),
      0,
    );
    const creditsEarned = this.walletTransactions
      .filter((item) => item.type === "CREDIT_EARNED" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    return simulateNetwork({
      profile: {
        firstName: processorProfileSeed.firstName,
        organizationName: processorProfileSeed.organizationName,
      },
      metrics: {
        assignedCount,
        awaitingReceipt,
        inProcessing,
        completedBatches,
        outputsProduced,
        creditsEarned,
      },
      recentAssignments: [...this.assignments]
        .sort((a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt))
        .slice(0, 5),
      activeBatches: this.batches.filter((item) => item.status === "ACTIVE" || item.status === "DRAFT").slice(0, 4),
    });
  }

  async getAssignments(query?: ProcessorAssignmentQuery): Promise<ProcessorAssignment[]> {
    const search = normalize(query?.search ?? "");
    const status = query?.status ?? "ALL";
    const wasteType = query?.wasteType ?? "ALL";
    const zone = query?.zone ?? "ALL";
    const processingCenter = query?.processingCenter ?? "ALL";

    const filtered = this.assignments.filter((item) => {
      const matchesSearch =
        !search ||
        normalize(item.reference).includes(search) ||
        normalize(item.collectorName).includes(search) ||
        normalize(item.collectionPoint ?? "").includes(search);
      const matchesStatus = status === "ALL" || item.status === status;
      const matchesWasteType = wasteType === "ALL" || item.wasteType === wasteType;
      const matchesZone = zone === "ALL" || item.zone === zone;
      const matchesCenter = processingCenter === "ALL" || item.processingCenter === processingCenter;
      return matchesSearch && matchesStatus && matchesWasteType && matchesZone && matchesCenter;
    });

    filtered.sort((a, b) => +new Date(b.assignedAt) - +new Date(a.assignedAt));

    return simulateNetwork(clone(filtered));
  }

  async getAssignmentById(submissionId: string): Promise<ProcessorAssignment> {
    const assignment = this.assignments.find((item) => item.id === submissionId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    return simulateNetwork(clone(assignment));
  }

  async getAssignmentsByIds(assignmentIds: string[]): Promise<ProcessorAssignment[]> {
    const mapped = this.assignments.filter((item) => assignmentIds.includes(item.id));
    return simulateNetwork(clone(mapped));
  }

  async confirmReceipt(submissionId: string): Promise<ProcessorAssignment> {
    return this.updateAssignmentStatus(
      submissionId,
      "RECEIVED",
      "Receipt Confirmed",
      "Input received and checked at the processing center.",
    );
  }

  async startProcessing(submissionId: string): Promise<ProcessorAssignment> {
    return this.updateAssignmentStatus(
      submissionId,
      "IN_PROCESSING",
      "Processing Started",
      "Input moved to active processing line.",
    );
  }

  async markAssignmentProcessed(submissionId: string): Promise<ProcessorAssignment> {
    return this.updateAssignmentStatus(
      submissionId,
      "PROCESSED",
      "Processed",
      "Assignment marked as processed and ready for output reconciliation.",
    );
  }

  async getBatches(query?: ProcessorBatchQuery): Promise<ProcessorBatch[]> {
    const search = normalize(query?.search ?? "");
    const status = query?.status ?? "ALL";
    const wasteType = query?.wasteType ?? "ALL";

    const filtered = this.batches.filter((item) => {
      const matchesSearch =
        !search ||
        normalize(item.reference).includes(search) ||
        normalize(item.processingCenter).includes(search);
      const matchesStatus = status === "ALL" || item.status === status;
      const matchesType = wasteType === "ALL" || item.wasteType === wasteType;
      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));

    return simulateNetwork(clone(filtered));
  }

  async getBatchById(batchId: string): Promise<ProcessorBatch> {
    const batch = this.batches.find((item) => item.id === batchId);
    if (!batch) {
      throw new Error("Batch not found.");
    }

    return simulateNetwork(clone(batch));
  }

  async getBatchCreationMeta(): Promise<ProcessorBatchCreationMeta> {
    const assignmentIdsInBatches = new Set(
      this.batches
        .filter((batch) => batch.status !== "COMPLETED")
        .flatMap((batch) => batch.assignmentIds),
    );

    const eligibleAssignments = this.assignments.filter(
      (item) =>
        (item.status === "RECEIVED" || item.status === "IN_PROCESSING") &&
        !assignmentIdsInBatches.has(item.id),
    );

    return simulateNetwork({
      eligibleAssignments: clone(eligibleAssignments),
      processingCenters: clone(processorCentersSeed),
    });
  }

  async createBatch(payload: CreateProcessorBatchInput): Promise<ProcessorBatch> {
    if (payload.assignmentIds.length === 0) {
      throw new Error("Select at least one eligible input.");
    }

    if (!payload.processingCenter.trim()) {
      throw new Error("Processing center is required.");
    }

    const selectedAssignments = this.assignments.filter((item) => payload.assignmentIds.includes(item.id));
    if (selectedAssignments.length === 0) {
      throw new Error("Selected assignments are not available.");
    }

    const wasteType = selectedAssignments[0].wasteType;
    const hasMixedTypes = selectedAssignments.some((item) => item.wasteType !== wasteType);
    if (hasMixedTypes) {
      throw new Error("Selected inputs must be of the same waste type.");
    }

    const inputWeightKg = selectedAssignments.reduce((sum, item) => sum + item.weightKg, 0);
    const inputReferences = selectedAssignments.map((item) => item.reference);
    const now = new Date().toISOString();

    const batch: ProcessorBatch = {
      id: createId("pbatch"),
      reference: createBatchRef(),
      wasteType,
      inputWeightKg,
      processingCenter: payload.processingCenter.trim(),
      processorName: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
      assignmentIds: selectedAssignments.map((item) => item.id),
      inputReferences,
      outputs: [],
      status: "DRAFT",
      startedAt: now,
      notes: payload.notes?.trim(),
      timeline: [
        {
          id: createId("btl"),
          title: "Batch Drafted",
          at: now,
          status: "DRAFT",
          actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
        },
      ],
      history: [
        {
          id: createId("bhs"),
          action: "BATCH_DRAFT_CREATED",
          at: now,
          actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
          details: `Batch created from ${selectedAssignments.length} inputs (${inputWeightKg} kg).`,
        },
      ],
    };

    this.batches.unshift(batch);

    selectedAssignments.forEach((assignment) => {
      assignment.status = "IN_PROCESSING";
      assignment.timeline.push({
        id: createId("ptl"),
        title: "Linked to Batch",
        at: now,
        status: "IN_PROCESSING",
        actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
        note: `Linked to batch ${batch.reference}`,
      });
      assignment.history.unshift({
        id: createId("phs"),
        action: "BATCH_LINKED",
        at: now,
        actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
        details: `Assignment linked to ${batch.reference}.`,
      });
    });

    return simulateNetwork(clone(batch));
  }

  async recordBatchOutput(batchId: string, payload: RecordProcessorOutputInput): Promise<ProcessorBatch> {
    const batch = this.batches.find((item) => item.id === batchId);
    if (!batch) {
      throw new Error("Batch not found.");
    }

    if (payload.quantity <= 0) {
      throw new Error("Output quantity must be greater than zero.");
    }

    const now = new Date().toISOString();

    batch.outputs.push({
      id: createId("pout"),
      outputType: payload.outputType,
      quantity: payload.quantity,
      unit: payload.unit,
      notes: payload.notes?.trim(),
      recordedAt: now,
    });

    if (batch.status === "DRAFT") {
      batch.status = "ACTIVE";
      batch.timeline.push({
        id: createId("btl"),
        title: "Batch Activated",
        at: now,
        status: "ACTIVE",
        actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
      });
    }

    batch.timeline.push({
      id: createId("btl"),
      title: "Output Recorded",
      at: now,
      status: batch.status,
      actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
      note: `${payload.outputType.replaceAll("_", " ")} • ${payload.quantity} ${payload.unit}`,
    });

    batch.history.unshift({
      id: createId("bhs"),
      action: "OUTPUT_RECORDED",
      at: now,
      actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
      details: `Recorded ${payload.quantity} ${payload.unit} of ${payload.outputType.replaceAll("_", " ")}.`,
    });

    return simulateNetwork(clone(batch));
  }

  async completeBatch(batchId: string): Promise<ProcessorBatch> {
    const batch = this.batches.find((item) => item.id === batchId);
    if (!batch) {
      throw new Error("Batch not found.");
    }

    if (batch.outputs.length === 0) {
      throw new Error("Record at least one output before completing the batch.");
    }

    const now = new Date().toISOString();

    batch.status = "COMPLETED";
    batch.completedAt = now;
    batch.timeline.push({
      id: createId("btl"),
      title: "Batch Completed",
      at: now,
      status: "COMPLETED",
      actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
    });
    batch.history.unshift({
      id: createId("bhs"),
      action: "BATCH_COMPLETED",
      at: now,
      actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
      details: "Batch closed and outputs finalized.",
    });

    this.assignments.forEach((assignment) => {
      if (batch.assignmentIds.includes(assignment.id)) {
        assignment.status = "PROCESSED";
        assignment.timeline.push({
          id: createId("ptl"),
          title: "Processed",
          at: now,
          status: "PROCESSED",
          actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
          note: `Completed via ${batch.reference}`,
        });
        assignment.history.unshift({
          id: createId("phs"),
          action: "ASSIGNMENT_PROCESSED",
          at: now,
          actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
          details: `Closed through batch ${batch.reference}.`,
        });
      }
    });

    this.walletTransactions.unshift({
      id: createId("pwt"),
      type: "CREDIT_EARNED",
      amount: 120,
      status: "SUCCESS",
      context: `Credits from batch ${batch.reference}`,
      reference: batch.reference,
      createdAt: now,
    });

    return simulateNetwork(clone(batch));
  }

  async getWalletData(): Promise<ProcessorWalletData> {
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

  async requestRedemption(payload: CreateProcessorRedemptionInput): Promise<ProcessorRedemptionRequest> {
    if (payload.amount <= 0 || !payload.requestedItem.trim()) {
      throw new Error("Requested amount and item are required.");
    }

    const now = new Date().toISOString();

    const request: ProcessorRedemptionRequest = {
      id: createId("pred"),
      amount: payload.amount,
      requestedItem: payload.requestedItem.trim(),
      status: "PENDING",
      notes: payload.notes?.trim(),
      createdAt: now,
    };

    this.redemptionRequests.unshift(request);
    this.walletTransactions.unshift({
      id: createId("pwt"),
      type: "REDEMPTION_REQUESTED",
      amount: -Math.abs(payload.amount),
      status: "PENDING",
      context: `Redemption requested for ${request.requestedItem}`,
      createdAt: now,
    });

    return simulateNetwork(clone(request));
  }

  async getPerformanceData(): Promise<ProcessorPerformanceData> {
    const completedBatches = this.batches.filter((item) => item.status === "COMPLETED").length;
    const processedSubmissions = this.assignments.filter((item) => item.status === "PROCESSED").length;
    const totalOutputQuantity = this.batches.reduce(
      (sum, batch) => sum + batch.outputs.reduce((inner, output) => inner + output.quantity, 0),
      0,
    );
    const creditsEarned = this.walletTransactions
      .filter((item) => item.type === "CREDIT_EARNED" && item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    return simulateNetwork({
      ...this.performance,
      completedBatches,
      processedSubmissions,
      totalOutputQuantity,
      creditsEarned,
    });
  }

  async getAccountProfile(): Promise<ProcessorAccountProfile> {
    return simulateNetwork(clone(processorProfileSeed));
  }

  async getFilterMeta(): Promise<ProcessorFilterMeta> {
    return simulateNetwork({
      zones: clone(processorZonesSeed),
      processingCenters: clone(processorCentersSeed),
    });
  }

  private updateAssignmentStatus(
    submissionId: string,
    status: ProcessorAssignment["status"],
    title: string,
    details: string,
  ): Promise<ProcessorAssignment> {
    const assignment = this.assignments.find((item) => item.id === submissionId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    const now = new Date().toISOString();

    assignment.status = status;
    assignment.timeline.push({
      id: createId("ptl"),
      title,
      at: now,
      status,
      actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
    });
    assignment.history.unshift({
      id: createId("phs"),
      action: title.toUpperCase().replaceAll(" ", "_"),
      at: now,
      actor: `${processorProfileSeed.firstName} ${processorProfileSeed.lastName}`,
      details,
    });

    return simulateNetwork(clone(assignment));
  }
}

export const processorService = new ProcessorService();

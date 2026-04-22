import { simulateNetwork } from "@/lib/api/client";
import {
  collectionPointsSeed,
  geoZonesSeed,
  inventoryLotsSeed,
  inventoryMovementsSeed,
  ordersSeed,
  orgAdminProfileSeed,
  orgAnalyticsSummarySeed,
  orgTeamUsersSeed,
  processingBatchesSeed,
  processingCentersSeed,
  productsSeed,
  redemptionRequestsSeed,
  walletTransactionsSeed,
  wasteSubmissionsSeed,
} from "@/lib/org-admin-mock-data";
import {
  type CollectionPoint,
  type CreateProductInput,
  type CreateTeamUserInput,
  type GeoZone,
  type InventoryLot,
  type InventoryMovement,
  type Order,
  type OrderQuery,
  type OrgAccountProfile,
  type OrgAnalyticsSummary,
  type OrgDashboardData,
  type OrgTeamUser,
  type ProcessingBatch,
  type ProcessingCenter,
  type Product,
  type ProductQuery,
  type RedemptionRequest,
  type TeamQuery,
  type WasteQuery,
  type WasteStatus,
  type WasteSubmission,
  type WalletTransaction,
} from "@/types/org-admin";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalize(term: string) {
  return term.trim().toLowerCase();
}

function createId(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

class OrgAdminService {
  private teamUsers = clone(orgTeamUsersSeed);

  private wasteSubmissions = clone(wasteSubmissionsSeed);

  private processingBatches = clone(processingBatchesSeed);

  private products = clone(productsSeed);

  private inventoryLots = clone(inventoryLotsSeed);

  private inventoryMovements = clone(inventoryMovementsSeed);

  private orders = clone(ordersSeed);

  private redemptionRequests = clone(redemptionRequestsSeed);

  private walletTransactions = clone(walletTransactionsSeed);

  private analytics = clone(orgAnalyticsSummarySeed);

  private zones = clone(geoZonesSeed);

  private collectionPoints = clone(collectionPointsSeed);

  private processingCenters = clone(processingCentersSeed);

  async getDashboardData(): Promise<OrgDashboardData> {
    const totalWasteKg = this.wasteSubmissions.reduce((sum, item) => sum + item.weightKg, 0);
    const pendingApprovals = this.wasteSubmissions.filter(
      (item) => item.status === "SUBMITTED" || item.status === "UNDER_REVIEW",
    ).length;
    const activeProcessors = this.teamUsers.filter(
      (user) => user.role === "PROCESSOR" && user.status === "ACTIVE",
    ).length;
    const creditsIssued = this.walletTransactions
      .filter((tx) => tx.type === "CREDIT_ISSUED")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const inventoryValue = this.products.reduce((sum, product) => sum + product.stockAvailable * product.price, 0);
    const totalRevenue = this.orders
      .filter((order) => order.paymentStatus === "PAID")
      .reduce((sum, order) => sum + order.total, 0);

    return simulateNetwork({
      kpis: {
        totalWasteKg,
        pendingApprovals,
        activeProcessors,
        creditsIssued,
        inventoryValue,
        totalRevenue,
        totalOrders: this.orders.length,
      },
      wastePipeline: [
        { status: "SUBMITTED", value: this.countWasteStatus("SUBMITTED") },
        { status: "UNDER_REVIEW", value: this.countWasteStatus("UNDER_REVIEW") },
        { status: "APPROVED", value: this.countWasteStatus("APPROVED") },
        { status: "ASSIGNED", value: this.countWasteStatus("ASSIGNED") },
        { status: "IN_PROCESSING", value: this.countWasteStatus("IN_PROCESSING") },
        { status: "PROCESSED", value: this.countWasteStatus("PROCESSED") },
      ],
      reviewQueue: this.wasteSubmissions
        .filter((item) => item.status === "SUBMITTED" || item.status === "UNDER_REVIEW")
        .slice(0, 5),
      processingActivity: this.processingBatches.slice(0, 4),
      lowInventory: this.inventoryLots.filter((lot) => lot.status !== "GOOD").slice(0, 4),
      recentOrders: [...this.orders]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 5),
    });
  }

  async getTeamUsers(query?: TeamQuery): Promise<OrgTeamUser[]> {
    const search = normalize(query?.search ?? "");
    const role = query?.role ?? "ALL";
    const status = query?.status ?? "ALL";

    const filtered = this.teamUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      const matchesSearch =
        !search ||
        normalize(fullName).includes(search) ||
        normalize(user.email).includes(search) ||
        normalize(user.zone ?? "").includes(search);
      const matchesRole = role === "ALL" || user.role === role;
      const matchesStatus = status === "ALL" || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });

    filtered.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
    return simulateNetwork(clone(filtered));
  }

  async getTeamUserById(userId: string): Promise<OrgTeamUser> {
    const user = this.teamUsers.find((item) => item.id === userId);
    if (!user) {
      throw new Error("Team user not found.");
    }

    return simulateNetwork(clone(user));
  }

  async createTeamUser(payload: CreateTeamUserInput): Promise<OrgTeamUser> {
    if (!payload.firstName.trim() || !payload.lastName.trim() || !payload.email.trim()) {
      throw new Error("First name, last name, and email are required.");
    }

    const exists = this.teamUsers.some((user) => normalize(user.email) === normalize(payload.email));
    if (exists) {
      throw new Error("A team user with this email already exists.");
    }

    const newUser: OrgTeamUser = {
      id: createId("team"),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim(),
      role: payload.role,
      status: "INVITED",
      zone: payload.zone,
      assignment: payload.role === "COLLECTOR" ? "Route assignment pending" : "Assignment pending",
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      stats: {},
    };

    this.teamUsers.unshift(newUser);

    return simulateNetwork(clone(newUser));
  }

  async toggleTeamUserStatus(userId: string): Promise<OrgTeamUser> {
    const user = this.teamUsers.find((item) => item.id === userId);
    if (!user) {
      throw new Error("Team user not found.");
    }

    user.status = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    return simulateNetwork(clone(user));
  }

  async getWasteSubmissions(query?: WasteQuery): Promise<WasteSubmission[]> {
    const search = normalize(query?.search ?? "");
    const status = query?.status ?? "ALL";
    const wasteType = query?.wasteType ?? "ALL";
    const zone = query?.zone ?? "ALL";
    const collectorId = query?.collectorId ?? "ALL";
    const processorId = query?.processorId ?? "ALL";

    const filtered = this.wasteSubmissions.filter((submission) => {
      const matchesSearch =
        !search ||
        normalize(submission.reference).includes(search) ||
        normalize(submission.collectorName).includes(search) ||
        normalize(submission.collectionPoint).includes(search);
      const matchesStatus = status === "ALL" || submission.status === status;
      const matchesWasteType = wasteType === "ALL" || submission.wasteType === wasteType;
      const matchesZone = zone === "ALL" || submission.zone === zone;
      const matchesCollector = collectorId === "ALL" || submission.collectorId === collectorId;
      const matchesProcessor = processorId === "ALL" || submission.assignedProcessorId === processorId;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesWasteType &&
        matchesZone &&
        matchesCollector &&
        matchesProcessor
      );
    });

    filtered.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
    return simulateNetwork(clone(filtered));
  }

  async getWasteSubmissionById(submissionId: string): Promise<WasteSubmission> {
    const submission = this.wasteSubmissions.find((item) => item.id === submissionId);
    if (!submission) {
      throw new Error("Waste submission not found.");
    }

    return simulateNetwork(clone(submission));
  }

  async setWasteStatus(submissionId: string, status: WasteStatus, note?: string): Promise<WasteSubmission> {
    const submission = this.wasteSubmissions.find((item) => item.id === submissionId);
    if (!submission) {
      throw new Error("Waste submission not found.");
    }

    submission.status = status;
    submission.timeline.push({
      status,
      at: new Date().toISOString(),
      actor: `${orgAdminProfileSeed.firstName} ${orgAdminProfileSeed.lastName}`,
      note,
    });
    submission.history.unshift({
      id: createId("hist"),
      action: `STATUS_${status}`,
      actor: `${orgAdminProfileSeed.firstName} ${orgAdminProfileSeed.lastName}`,
      at: new Date().toISOString(),
      details: note ?? `Updated status to ${status.replaceAll("_", " ")}`,
    });

    return simulateNetwork(clone(submission));
  }

  async assignWasteProcessor(submissionId: string, processorId: string): Promise<WasteSubmission> {
    const submission = this.wasteSubmissions.find((item) => item.id === submissionId);
    if (!submission) {
      throw new Error("Waste submission not found.");
    }

    const processor = this.teamUsers.find((user) => user.id === processorId && user.role === "PROCESSOR");
    if (!processor) {
      throw new Error("Processor not found.");
    }

    submission.assignedProcessorId = processor.id;
    submission.assignedProcessorName = `${processor.firstName} ${processor.lastName}`;
    submission.status = "ASSIGNED";
    submission.timeline.push({
      status: "ASSIGNED",
      at: new Date().toISOString(),
      actor: `${orgAdminProfileSeed.firstName} ${orgAdminProfileSeed.lastName}`,
      note: `Assigned to ${submission.assignedProcessorName}`,
    });

    return simulateNetwork(clone(submission));
  }

  async getProcessingBatches(): Promise<ProcessingBatch[]> {
    const batches = [...this.processingBatches].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
    return simulateNetwork(clone(batches));
  }

  async getProducts(query?: ProductQuery): Promise<Product[]> {
    const search = normalize(query?.search ?? "");
    const category = query?.category ?? "ALL";
    const status = query?.status ?? "ALL";

    const filtered = this.products.filter((product) => {
      const matchesSearch =
        !search ||
        normalize(product.name).includes(search) ||
        normalize(product.category).includes(search);
      const matchesCategory = category === "ALL" || product.category === category;
      const matchesStatus = status === "ALL" || product.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return simulateNetwork(clone(filtered));
  }

  async createProduct(payload: CreateProductInput): Promise<Product> {
    if (!payload.name.trim()) {
      throw new Error("Product name is required.");
    }

    const newProduct: Product = {
      id: createId("prod"),
      name: payload.name.trim(),
      category: payload.category,
      unit: payload.unit,
      price: payload.price,
      status: payload.status,
      stockAvailable: payload.stockAvailable,
      description: payload.description?.trim(),
    };

    this.products.unshift(newProduct);

    return simulateNetwork(clone(newProduct));
  }

  async toggleProductStatus(productId: string): Promise<Product> {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    product.status = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    return simulateNetwork(clone(product));
  }

  async getInventoryOverview(): Promise<{
    summary: {
      totalStockUnits: number;
      lowStockLots: number;
      riskLots: number;
      stockValue: number;
    };
    stock: Product[];
    lots: InventoryLot[];
    movements: InventoryMovement[];
  }> {
    const totalStockUnits = this.products.reduce((sum, product) => sum + product.stockAvailable, 0);
    const lowStockLots = this.inventoryLots.filter((lot) => lot.status === "LOW").length;
    const riskLots = this.inventoryLots.filter((lot) => lot.status === "RISK").length;
    const stockValue = this.products.reduce((sum, product) => sum + product.stockAvailable * product.price, 0);

    return simulateNetwork({
      summary: { totalStockUnits, lowStockLots, riskLots, stockValue },
      stock: clone(this.products),
      lots: clone(this.inventoryLots),
      movements: clone(this.inventoryMovements).sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    });
  }

  async getOrders(query?: OrderQuery): Promise<Order[]> {
    const search = normalize(query?.search ?? "");
    const paymentStatus = query?.paymentStatus ?? "ALL";
    const deliveryStatus = query?.deliveryStatus ?? "ALL";

    const filtered = this.orders.filter((order) => {
      const matchesSearch = !search || normalize(order.id).includes(search) || normalize(order.buyerName).includes(search);
      const matchesPayment = paymentStatus === "ALL" || order.paymentStatus === paymentStatus;
      const matchesDelivery = deliveryStatus === "ALL" || order.deliveryStatus === deliveryStatus;
      return matchesSearch && matchesPayment && matchesDelivery;
    });

    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return simulateNetwork(clone(filtered));
  }

  async updateOrderDeliveryStatus(orderId: string, status: Order["deliveryStatus"]): Promise<Order> {
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("Order not found.");
    }

    order.deliveryStatus = status;
    return simulateNetwork(clone(order));
  }

  async getWalletOverview(): Promise<{
    summary: {
      creditsIssued: number;
      pendingRedemptions: number;
      approvedRedemptions: number;
    };
    requests: RedemptionRequest[];
    transactions: WalletTransaction[];
  }> {
    const creditsIssued = this.walletTransactions
      .filter((item) => item.type === "CREDIT_ISSUED")
      .reduce((sum, item) => sum + item.amount, 0);
    const pendingRedemptions = this.redemptionRequests.filter((item) => item.status === "PENDING").length;
    const approvedRedemptions = this.redemptionRequests.filter((item) => item.status === "APPROVED").length;

    return simulateNetwork({
      summary: { creditsIssued, pendingRedemptions, approvedRedemptions },
      requests: clone(this.redemptionRequests).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      transactions: clone(this.walletTransactions).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    });
  }

  async reviewRedemption(requestId: string, decision: "APPROVED" | "REJECTED"): Promise<RedemptionRequest> {
    const request = this.redemptionRequests.find((item) => item.id === requestId);
    if (!request) {
      throw new Error("Redemption request not found.");
    }

    request.status = decision;

    this.walletTransactions.unshift({
      id: createId("txn"),
      type: decision === "APPROVED" ? "REDEMPTION_APPROVED" : "REDEMPTION_REJECTED",
      userName: request.userName,
      amount: request.amount,
      createdAt: new Date().toISOString(),
      note: `Request ${request.id} ${decision.toLowerCase()}`,
    });

    return simulateNetwork(clone(request));
  }

  async getAnalytics(): Promise<OrgAnalyticsSummary> {
    return simulateNetwork(clone(this.analytics));
  }

  async getGeoData(): Promise<{
    zones: GeoZone[];
    collectionPoints: CollectionPoint[];
    processingCenters: ProcessingCenter[];
  }> {
    return simulateNetwork({
      zones: clone(this.zones),
      collectionPoints: clone(this.collectionPoints),
      processingCenters: clone(this.processingCenters),
    });
  }

  async createZone(name: string): Promise<GeoZone> {
    if (!name.trim()) {
      throw new Error("Zone name is required.");
    }

    const zone: GeoZone = {
      id: createId("zone"),
      name: name.trim(),
      status: "ACTIVE",
      collectors: 0,
    };

    this.zones.unshift(zone);
    return simulateNetwork(clone(zone));
  }

  async createCollectionPoint(name: string, zone: string): Promise<CollectionPoint> {
    if (!name.trim() || !zone.trim()) {
      throw new Error("Collection point name and zone are required.");
    }

    const point: CollectionPoint = {
      id: createId("cp"),
      name: name.trim(),
      zone: zone.trim(),
      status: "ACTIVE",
    };

    this.collectionPoints.unshift(point);
    return simulateNetwork(clone(point));
  }

  async createProcessingCenter(name: string, zone: string): Promise<ProcessingCenter> {
    if (!name.trim() || !zone.trim()) {
      throw new Error("Processing center name and zone are required.");
    }

    const center: ProcessingCenter = {
      id: createId("pc"),
      name: name.trim(),
      zone: zone.trim(),
      status: "ACTIVE",
    };

    this.processingCenters.unshift(center);
    return simulateNetwork(clone(center));
  }

  async getAccountProfile(): Promise<OrgAccountProfile> {
    return simulateNetwork(clone(orgAdminProfileSeed));
  }

  async listWasteFilters(): Promise<{
    zones: string[];
    collectors: Array<{ id: string; label: string }>;
    processors: Array<{ id: string; label: string }>;
  }> {
    const zones = Array.from(new Set(this.wasteSubmissions.map((item) => item.zone))).sort();
    const collectors = this.teamUsers
      .filter((user) => user.role === "COLLECTOR")
      .map((user) => ({ id: user.id, label: `${user.firstName} ${user.lastName}` }));
    const processors = this.teamUsers
      .filter((user) => user.role === "PROCESSOR")
      .map((user) => ({ id: user.id, label: `${user.firstName} ${user.lastName}` }));

    return simulateNetwork({ zones, collectors, processors });
  }

  private countWasteStatus(status: WasteStatus) {
    return this.wasteSubmissions.filter((item) => item.status === status).length;
  }
}

export const orgAdminService = new OrgAdminService();

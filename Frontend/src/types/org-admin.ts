import { type PlatformRole } from "@/types/platform";

export type TeamRole = Extract<PlatformRole, "ORG_ADMIN" | "COLLECTOR" | "PROCESSOR" | "BUYER">;
export type TeamStatus = "ACTIVE" | "SUSPENDED" | "INVITED";

export type WasteStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ASSIGNED"
  | "IN_PROCESSING"
  | "PROCESSED";

export type WasteType = "ORGANIC" | "PLASTIC" | "PAPER" | "METAL" | "GLASS";

export interface OrgTeamUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: TeamRole;
  status: TeamStatus;
  zone?: string;
  assignment?: string;
  joinedAt: string;
  lastActiveAt?: string;
  stats: {
    submissionsCount?: number;
    approvalRate?: number;
    creditsEarned?: number;
    batchesCompleted?: number;
    outputsProducedKg?: number;
    ordersPlaced?: number;
    totalPurchased?: number;
  };
}

export interface WasteSubmission {
  id: string;
  reference: string;
  collectorId: string;
  collectorName: string;
  wasteType: WasteType;
  weightKg: number;
  zone: string;
  collectionPoint: string;
  tagCode?: string;
  submittedAt: string;
  assignedProcessorId?: string;
  assignedProcessorName?: string;
  status: WasteStatus;
  notes?: string;
  images?: string[];
  timeline: Array<{
    status: WasteStatus;
    at: string;
    note?: string;
    actor: string;
  }>;
  history: Array<{
    id: string;
    action: string;
    actor: string;
    at: string;
    details: string;
  }>;
}

export interface ProcessingBatch {
  id: string;
  reference: string;
  processorName: string;
  wasteType: WasteType;
  inputKg: number;
  outputKg: number;
  status: "QUEUED" | "ACTIVE" | "COMPLETED";
  startedAt: string;
  completedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: "LARVAE" | "FERTILIZER" | "PLASTIC_BRICKS" | "GARDEN_STAKES" | "OTHER";
  unit: "kg" | "bag" | "piece";
  price: number;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  stockAvailable: number;
  description?: string;
}

export interface InventoryLot {
  id: string;
  productId: string;
  productName: string;
  lotCode: string;
  quantity: number;
  unit: Product["unit"];
  location: string;
  expiresAt?: string;
  status: "GOOD" | "LOW" | "RISK";
}

export interface InventoryMovement {
  id: string;
  productName: string;
  lotCode: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  unit: Product["unit"];
  reason: string;
  actor: string;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerName: string;
  productCount: number;
  total: number;
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  deliveryStatus: "PENDING" | "IN_TRANSIT" | "DELIVERED";
  createdAt: string;
  lines: Array<{ productName: string; quantity: number; unitPrice: number }>;
}

export interface RedemptionRequest {
  id: string;
  userName: string;
  amount: number;
  requestedItem: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface WalletTransaction {
  id: string;
  type: "CREDIT_ISSUED" | "REDEMPTION_APPROVED" | "REDEMPTION_REJECTED";
  userName: string;
  amount: number;
  createdAt: string;
  note: string;
}

export interface GeoZone {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  collectors: number;
}

export interface CollectionPoint {
  id: string;
  name: string;
  zone: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ProcessingCenter {
  id: string;
  name: string;
  zone: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface OrgDashboardData {
  kpis: {
    totalWasteKg: number;
    pendingApprovals: number;
    activeProcessors: number;
    creditsIssued: number;
    inventoryValue: number;
    totalRevenue: number;
    totalOrders: number;
  };
  wastePipeline: Array<{ status: WasteStatus; value: number }>;
  reviewQueue: WasteSubmission[];
  processingActivity: ProcessingBatch[];
  lowInventory: InventoryLot[];
  recentOrders: Order[];
}

export interface OrgAnalyticsSummary {
  wasteByType: Array<{ type: WasteType; weightKg: number }>;
  wasteByZone: Array<{ zone: string; weightKg: number }>;
  approvalsTrend: Array<{ label: string; approved: number; rejected: number }>;
  processorOutputTrend: Array<{ label: string; outputKg: number }>;
  creditsIssuedTrend: Array<{ label: string; credits: number }>;
  revenueTrend: Array<{ label: string; revenue: number }>;
}

export interface TeamQuery {
  search?: string;
  role?: TeamRole | "ALL";
  status?: TeamStatus | "ALL";
}

export interface WasteQuery {
  search?: string;
  status?: WasteStatus | "ALL";
  wasteType?: WasteType | "ALL";
  zone?: string | "ALL";
  collectorId?: string | "ALL";
  processorId?: string | "ALL";
}

export interface ProductQuery {
  search?: string;
  category?: Product["category"] | "ALL";
  status?: Product["status"] | "ALL";
}

export interface OrderQuery {
  search?: string;
  paymentStatus?: Order["paymentStatus"] | "ALL";
  deliveryStatus?: Order["deliveryStatus"] | "ALL";
}

export interface CreateTeamUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: TeamRole;
  zone?: string;
}

export interface CreateProductInput {
  name: string;
  category: Product["category"];
  unit: Product["unit"];
  price: number;
  status: Product["status"];
  stockAvailable: number;
  description?: string;
}

export interface OrgAccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ORG_ADMIN";
  status: TeamStatus;
  organizationName: string;
  joinedAt: string;
  lastActiveAt: string;
}

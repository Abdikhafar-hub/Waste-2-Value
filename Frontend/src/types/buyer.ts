export type BuyerProductCategory =
  | "LARVAE"
  | "FERTILIZER"
  | "PLASTIC_BRICKS"
  | "GARDEN_STAKES";

export type BuyerUnit = "kg" | "bag" | "piece";

export type BuyerProductAvailability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type BuyerOrderStatus = "PLACED" | "CONFIRMED" | "FULFILLING" | "COMPLETED";

export type BuyerPaymentStatus = "PENDING" | "PAID" | "FAILED";

export type BuyerDeliveryStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED";

export interface BuyerProduct {
  id: string;
  name: string;
  category: BuyerProductCategory;
  unit: BuyerUnit;
  price: number;
  availableQuantity: number;
  availability: BuyerProductAvailability;
  description: string;
  producerOrganization: string;
  featured?: boolean;
}

export interface BuyerOrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unit: BuyerUnit;
  unitPrice: number;
  lineTotal: number;
}

export interface BuyerOrderTimelineItem {
  id: string;
  title: string;
  at: string;
  status: string;
  note?: string;
}

export interface BuyerOrder {
  id: string;
  reference: string;
  createdAt: string;
  orderStatus: BuyerOrderStatus;
  paymentStatus: BuyerPaymentStatus;
  deliveryStatus: BuyerDeliveryStatus;
  totalAmount: number;
  itemCount: number;
  buyerOrganization: string;
  notes?: string;
  lines: BuyerOrderLine[];
  timeline: BuyerOrderTimelineItem[];
}

export interface BuyerDashboardData {
  profile: {
    firstName: string;
    organizationName: string;
  };
  metrics: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    totalSpend: number;
  };
  recentOrders: BuyerOrder[];
  featuredProducts: BuyerProduct[];
}

export interface BuyerMarketplaceQuery {
  search?: string;
  category?: BuyerProductCategory | "ALL";
  availability?: BuyerProductAvailability | "ALL";
  maxPrice?: number | "ALL";
}

export interface BuyerOrderQuery {
  search?: string;
  orderStatus?: BuyerOrderStatus | "ALL";
  paymentStatus?: BuyerPaymentStatus | "ALL";
  deliveryStatus?: BuyerDeliveryStatus | "ALL";
}

export interface CreateBuyerOrderInput {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface BuyerMarketplaceFilterMeta {
  categories: BuyerProductCategory[];
}

export interface BuyerAccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "BUYER";
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  organizationName: string;
  joinedAt: string;
  lastActiveAt: string;
}

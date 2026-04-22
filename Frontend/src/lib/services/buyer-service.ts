import { simulateNetwork } from "@/lib/api/client";
import {
  buyerOrdersSeed,
  buyerProductsSeed,
  buyerProfileSeed,
} from "@/lib/buyer-mock-data";
import {
  type BuyerAccountProfile,
  type BuyerDashboardData,
  type BuyerMarketplaceFilterMeta,
  type BuyerMarketplaceQuery,
  type BuyerOrder,
  type BuyerOrderQuery,
  type BuyerProduct,
  type CreateBuyerOrderInput,
} from "@/types/buyer";

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

function createOrderReference() {
  const random = Math.floor(7900 + Math.random() * 160);
  return `W2V-ORD-${random}`;
}

function availabilityFromQuantity(quantity: number): BuyerProduct["availability"] {
  if (quantity <= 0) {
    return "OUT_OF_STOCK";
  }

  if (quantity <= 60) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

class BuyerService {
  private products = clone(buyerProductsSeed);

  private orders = clone(buyerOrdersSeed);

  async getDashboardData(): Promise<BuyerDashboardData> {
    const totalOrders = this.orders.length;
    const activeOrders = this.orders.filter(
      (order) => order.orderStatus !== "COMPLETED",
    ).length;
    const deliveredOrders = this.orders.filter(
      (order) => order.deliveryStatus === "DELIVERED",
    ).length;
    const totalSpend = this.orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return simulateNetwork({
      profile: {
        firstName: buyerProfileSeed.firstName,
        organizationName: buyerProfileSeed.organizationName,
      },
      metrics: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalSpend,
      },
      recentOrders: clone(this.orders)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 5),
      featuredProducts: clone(
        this.products
          .filter((item) => item.featured)
          .slice(0, 4),
      ),
    });
  }

  async getMarketplaceProducts(query?: BuyerMarketplaceQuery): Promise<BuyerProduct[]> {
    const search = normalize(query?.search ?? "");
    const category = query?.category ?? "ALL";
    const availability = query?.availability ?? "ALL";
    const maxPrice = query?.maxPrice ?? "ALL";

    const filtered = this.products.filter((product) => {
      const matchesSearch =
        !search ||
        normalize(product.name).includes(search) ||
        normalize(product.description).includes(search) ||
        normalize(product.producerOrganization).includes(search);

      const matchesCategory = category === "ALL" || product.category === category;
      const matchesAvailability = availability === "ALL" || product.availability === availability;
      const matchesPrice = maxPrice === "ALL" || product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesAvailability && matchesPrice;
    });

    filtered.sort((a, b) => {
      if (a.availability === "OUT_OF_STOCK" && b.availability !== "OUT_OF_STOCK") {
        return 1;
      }

      if (a.availability !== "OUT_OF_STOCK" && b.availability === "OUT_OF_STOCK") {
        return -1;
      }

      return a.name.localeCompare(b.name);
    });

    return simulateNetwork(clone(filtered));
  }

  async getMarketplaceFilterMeta(): Promise<BuyerMarketplaceFilterMeta> {
    const categories = Array.from(new Set(this.products.map((item) => item.category)));

    return simulateNetwork({ categories });
  }

  async getProductById(productId: string): Promise<BuyerProduct> {
    const product = this.products.find((item) => item.id === productId);

    if (!product) {
      throw new Error("Product not found.");
    }

    return simulateNetwork(clone(product));
  }

  async createOrder(payload: CreateBuyerOrderInput): Promise<BuyerOrder> {
    const product = this.products.find((item) => item.id === payload.productId);

    if (!product) {
      throw new Error("Product not found.");
    }

    if (payload.quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    if (payload.quantity > product.availableQuantity) {
      throw new Error("Requested quantity exceeds available stock.");
    }

    if (product.availability === "OUT_OF_STOCK") {
      throw new Error("This product is currently out of stock.");
    }

    const now = new Date().toISOString();

    const lineTotal = payload.quantity * product.price;

    const order: BuyerOrder = {
      id: createId("bord"),
      reference: createOrderReference(),
      createdAt: now,
      orderStatus: "PLACED",
      paymentStatus: "PENDING",
      deliveryStatus: "PENDING",
      totalAmount: lineTotal,
      itemCount: 1,
      buyerOrganization: buyerProfileSeed.organizationName,
      notes: payload.notes?.trim(),
      lines: [
        {
          productId: product.id,
          productName: product.name,
          quantity: payload.quantity,
          unit: product.unit,
          unitPrice: product.price,
          lineTotal,
        },
      ],
      timeline: [
        {
          id: createId("botl"),
          title: "Order Placed",
          at: now,
          status: "PLACED",
        },
      ],
    };

    this.orders.unshift(order);

    product.availableQuantity -= payload.quantity;
    product.availability = availabilityFromQuantity(product.availableQuantity);

    return simulateNetwork(clone(order));
  }

  async getOrders(query?: BuyerOrderQuery): Promise<BuyerOrder[]> {
    const search = normalize(query?.search ?? "");
    const orderStatus = query?.orderStatus ?? "ALL";
    const paymentStatus = query?.paymentStatus ?? "ALL";
    const deliveryStatus = query?.deliveryStatus ?? "ALL";

    const filtered = this.orders.filter((order) => {
      const matchesSearch =
        !search ||
        normalize(order.reference).includes(search) ||
        normalize(order.lines.map((line) => line.productName).join(" ")).includes(search);
      const matchesOrderStatus = orderStatus === "ALL" || order.orderStatus === orderStatus;
      const matchesPayment = paymentStatus === "ALL" || order.paymentStatus === paymentStatus;
      const matchesDelivery = deliveryStatus === "ALL" || order.deliveryStatus === deliveryStatus;

      return matchesSearch && matchesOrderStatus && matchesPayment && matchesDelivery;
    });

    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return simulateNetwork(clone(filtered));
  }

  async getOrderById(orderId: string): Promise<BuyerOrder> {
    const order = this.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    return simulateNetwork(clone(order));
  }

  async getAccountProfile(): Promise<BuyerAccountProfile> {
    return simulateNetwork(clone(buyerProfileSeed));
  }
}

export const buyerService = new BuyerService();

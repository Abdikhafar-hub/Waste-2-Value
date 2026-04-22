import {
  analyticsSummarySeed,
  auditEventsSeed,
  organizationsSeed,
  platformUsersSeed,
  superAdminProfile,
} from "@/lib/mock-data";
import { simulateNetwork } from "@/lib/api/client";
import {
  type AuditEvent,
  type AuditQuery,
  type CreateOrganizationAdminInput,
  type CreateOrganizationInput,
  type DashboardData,
  type LoginInput,
  type LoginResult,
  type Organization,
  type OrganizationDetailData,
  type OrganizationQuery,
  type PlatformAnalyticsSummary,
  type PlatformUser,
  type PlatformUserDetailData,
  type UsersQuery,
} from "@/types/platform";

const PLATFORM_PASSWORD = "Admin@123";

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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createdWithinWindow(createdAt: string, window: "ALL" | "7D" | "30D" | "90D") {
  if (window === "ALL") {
    return true;
  }

  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const days = window === "7D" ? 7 : window === "30D" ? 30 : 90;
  return now - created <= days * 24 * 60 * 60 * 1000;
}

class PlatformService {
  private organizations = clone(organizationsSeed);

  private users = clone(platformUsersSeed);

  private auditEvents = clone(auditEventsSeed);

  async login(payload: LoginInput): Promise<LoginResult> {
    const email = normalize(payload.email);

    if (!email || !payload.password) {
      throw new Error("Email and password are required.");
    }

    const matchedUser = this.users.find((user) => normalize(user.email) === email);

    if (!matchedUser || payload.password !== PLATFORM_PASSWORD) {
      await simulateNetwork(null, { shouldFail: true, errorMessage: "Invalid credentials." });
      throw new Error("Invalid credentials.");
    }

    if (matchedUser.status === "SUSPENDED") {
      await simulateNetwork(null, {
        shouldFail: true,
        errorMessage: "This account is suspended. Contact your organization admin.",
      });
      throw new Error("This account is suspended. Contact your organization admin.");
    }

    this.logAudit({
      action: "LOGIN_SUCCESS",
      entityType: "AUTH",
      entityId: matchedUser.id,
      entityName: `${matchedUser.firstName} ${matchedUser.lastName}`,
      metadata: {
        channel: "web",
        role: matchedUser.role,
        rememberMe: String(payload.rememberMe),
      },
      actorName: `${matchedUser.firstName} ${matchedUser.lastName}`,
      actorEmail: matchedUser.email,
    });

    return simulateNetwork({
      token: `mock-${matchedUser.role.toLowerCase().replaceAll("_", "-")}-token`,
      user: clone(matchedUser),
    });
  }

  async getDashboardData(): Promise<DashboardData> {
    const totalOrganizations = this.organizations.length;
    const activeOrganizations = this.organizations.filter((org) => org.status === "ACTIVE").length;
    const suspendedOrganizations = this.organizations.filter((org) => org.status === "SUSPENDED").length;
    const totalUsers = this.users.length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newUsersThisPeriod = this.users.filter(
      (user) => new Date(user.createdAt).getTime() >= thirtyDaysAgo,
    ).length;

    const recentOrganizations = [...this.organizations]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5);
    const recentUsers = [...this.users]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 6);
    const recentAuditEvents = [...this.auditEvents]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);

    return simulateNetwork({
      metrics: {
        totalOrganizations,
        activeOrganizations,
        suspendedOrganizations,
        totalUsers,
        newUsersThisPeriod,
      },
      recentOrganizations,
      recentUsers,
      recentAuditEvents,
    });
  }

  async getOrganizations(query?: OrganizationQuery): Promise<Organization[]> {
    const search = normalize(query?.search ?? "");
    const status = query?.status ?? "ALL";
    const createdWindow = query?.createdWindow ?? "ALL";

    const filtered = this.organizations.filter((org) => {
      const matchesSearch =
        !search ||
        normalize(org.name).includes(search) ||
        normalize(org.slug).includes(search) ||
        normalize(org.description).includes(search);

      const matchesStatus = status === "ALL" || org.status === status;
      const matchesCreatedWindow = createdWithinWindow(org.createdAt, createdWindow);

      return matchesSearch && matchesStatus && matchesCreatedWindow;
    });

    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return simulateNetwork(clone(filtered));
  }

  async getOrganizationById(organizationId: string): Promise<OrganizationDetailData> {
    const organization = this.organizations.find((item) => item.id === organizationId);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const orgAdmins = this.users.filter(
      (user) => user.organizationId === organizationId && user.role === "ORG_ADMIN",
    );

    const recentUsers = this.users
      .filter((user) => user.organizationId === organizationId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 7);

    const recentAuditEvents = this.auditEvents
      .filter((event) => event.entityId === organizationId || event.metadata.organization === organization.name)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);

    const metadata: OrganizationDetailData["metadata"] = {
      tenantKey: `tenant_${organization.slug.replace(/-/g, "_")}`,
      readinessTier:
        organization.readinessScore >= 75
          ? "High"
          : organization.readinessScore >= 45
            ? "Medium"
            : "Low",
      lastPolicyReview: "2026-04-18T09:00:00.000Z",
    };

    return simulateNetwork({
      organization: clone(organization),
      orgAdmins: clone(orgAdmins),
      recentUsers: clone(recentUsers),
      recentAuditEvents: clone(recentAuditEvents),
      metadata,
    });
  }

  async createOrganization(payload: CreateOrganizationInput): Promise<Organization> {
    const name = payload.name.trim();
    const slug = slugify(payload.slug || payload.name);

    if (!name) {
      throw new Error("Organization name is required.");
    }

    if (!slug) {
      throw new Error("Organization slug is required.");
    }

    const existing = this.organizations.some((org) => org.slug === slug);
    if (existing) {
      throw new Error("Slug already exists. Try another one.");
    }

    const newOrganization: Organization = {
      id: createId("org"),
      name,
      slug,
      description: payload.description.trim(),
      status: payload.status,
      createdAt: new Date().toISOString(),
      userCount: 0,
      hasOrgAdmin: false,
      onboardingStage: "NOT_STARTED",
      readinessScore: 20,
    };

    this.organizations.unshift(newOrganization);

    this.logAudit({
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityId: newOrganization.id,
      entityName: newOrganization.name,
      metadata: {
        source: "Super Admin UI",
        status: newOrganization.status,
      },
    });

    return simulateNetwork(clone(newOrganization));
  }

  async createOrganizationAdmin(
    organizationId: string,
    payload: CreateOrganizationAdminInput,
  ): Promise<PlatformUser> {
    const organization = this.organizations.find((item) => item.id === organizationId);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const exists = this.users.some((user) => normalize(user.email) === normalize(payload.email));
    if (exists) {
      throw new Error("A platform user with this email already exists.");
    }

    const newAdmin: PlatformUser = {
      id: createId("user"),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || undefined,
      role: "ORG_ADMIN",
      organizationId: organization.id,
      organizationName: organization.name,
      status: "INVITED",
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    this.users.unshift(newAdmin);
    organization.hasOrgAdmin = true;
    organization.onboardingStage = organization.onboardingStage === "NOT_STARTED" ? "ADMIN_CREATED" : organization.onboardingStage;
    organization.userCount += 1;

    this.logAudit({
      action: "ORG_ADMIN_CREATED",
      entityType: "USER",
      entityId: newAdmin.id,
      entityName: `${newAdmin.firstName} ${newAdmin.lastName}`,
      metadata: {
        organization: organization.name,
        delivery: "Temporary password issued",
      },
    });

    return simulateNetwork(clone(newAdmin));
  }

  async toggleOrganizationStatus(organizationId: string): Promise<Organization> {
    const organization = this.organizations.find((item) => item.id === organizationId);

    if (!organization) {
      throw new Error("Organization not found.");
    }

    const nextStatus = organization.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    organization.status = nextStatus;

    this.logAudit({
      action: nextStatus === "ACTIVE" ? "ORGANIZATION_REACTIVATED" : "ORGANIZATION_SUSPENDED",
      entityType: "ORGANIZATION",
      entityId: organization.id,
      entityName: organization.name,
      metadata:
        nextStatus === "ACTIVE"
          ? { reviewer: "Platform Risk Desk" }
          : { reason: "Platform policy review" },
    });

    return simulateNetwork(clone(organization));
  }

  async getPlatformUsers(query?: UsersQuery): Promise<PlatformUser[]> {
    const search = normalize(query?.search ?? "");
    const role = query?.role ?? "ALL";
    const status = query?.status ?? "ALL";
    const organizationId = query?.organizationId ?? "ALL";

    const filtered = this.users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      const matchesSearch =
        !search ||
        normalize(fullName).includes(search) ||
        normalize(user.email).includes(search) ||
        normalize(user.organizationName ?? "").includes(search);
      const matchesRole = role === "ALL" || user.role === role;
      const matchesStatus = status === "ALL" || user.status === status;
      const matchesOrganization = organizationId === "ALL" || user.organizationId === organizationId;

      return matchesSearch && matchesRole && matchesStatus && matchesOrganization;
    });

    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return simulateNetwork(clone(filtered));
  }

  async getPlatformUserById(userId: string): Promise<PlatformUserDetailData> {
    const user = this.users.find((item) => item.id === userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const recentAuditEvents = this.auditEvents
      .filter(
        (event) =>
          event.entityId === user.id ||
          normalize(event.actorEmail) === normalize(user.email) ||
          normalize(event.entityName) === normalize(`${user.firstName} ${user.lastName}`),
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);

    return simulateNetwork({ user: clone(user), recentAuditEvents: clone(recentAuditEvents) });
  }

  async toggleUserStatus(userId: string): Promise<PlatformUser> {
    const user = this.users.find((item) => item.id === userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const nextStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    user.status = nextStatus;

    this.logAudit({
      action: nextStatus === "ACTIVE" ? "USER_REACTIVATED" : "USER_SUSPENDED",
      entityType: "USER",
      entityId: user.id,
      entityName: `${user.firstName} ${user.lastName}`,
      metadata:
        nextStatus === "ACTIVE"
          ? { reason: "Manual account restoration" }
          : { reason: "Risk signal review" },
    });

    return simulateNetwork(clone(user));
  }

  async getAnalyticsSummary(): Promise<PlatformAnalyticsSummary> {
    return simulateNetwork(clone(analyticsSummarySeed));
  }

  async getAuditEvents(query?: AuditQuery): Promise<AuditEvent[]> {
    const search = normalize(query?.search ?? "");
    const entityType = query?.entityType ?? "ALL";
    const action = query?.action ?? "ALL";

    const filtered = this.auditEvents.filter((event) => {
      const metadataMatch = Object.values(event.metadata)
        .join(" ")
        .toLowerCase()
        .includes(search);

      const matchesSearch =
        !search ||
        normalize(event.action).includes(search) ||
        normalize(event.actorName).includes(search) ||
        normalize(event.actorEmail).includes(search) ||
        normalize(event.entityName).includes(search) ||
        metadataMatch;

      const matchesEntity = entityType === "ALL" || event.entityType === entityType;
      const matchesAction = action === "ALL" || event.action === action;

      return matchesSearch && matchesEntity && matchesAction;
    });

    filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return simulateNetwork(clone(filtered));
  }

  async getAccountProfile(): Promise<PlatformUser> {
    const profile = this.users.find((user) => user.id === superAdminProfile.id) ?? superAdminProfile;
    return simulateNetwork(clone(profile));
  }

  async listOrganizationsForFilter(): Promise<Pick<Organization, "id" | "name">[]> {
    return simulateNetwork(
      this.organizations
        .map((org) => ({ id: org.id, name: org.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async listAuditActions(): Promise<string[]> {
    const actions = Array.from(new Set(this.auditEvents.map((event) => event.action))).sort();
    return simulateNetwork(actions);
  }

  private logAudit(input: {
    action: string;
    entityType: AuditEvent["entityType"];
    entityId: string;
    entityName: string;
    metadata: Record<string, string>;
    actorName?: string;
    actorEmail?: string;
  }) {
    const entry: AuditEvent = {
      id: createId("audit"),
      action: input.action,
      actorName: input.actorName ?? `${superAdminProfile.firstName} ${superAdminProfile.lastName}`,
      actorEmail: input.actorEmail ?? superAdminProfile.email,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      createdAt: new Date().toISOString(),
      ipAddress: "105.21.93.12",
      metadata: input.metadata,
    };

    this.auditEvents.unshift(entry);
  }
}

export const platformService = new PlatformService();

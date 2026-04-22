export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "DRAFT";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "INVITED";

export type PlatformRole =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "COLLECTOR"
  | "PROCESSOR"
  | "BUYER";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: OrganizationStatus;
  createdAt: string;
  userCount: number;
  hasOrgAdmin: boolean;
  onboardingStage: "NOT_STARTED" | "ADMIN_CREATED" | "SETUP_IN_PROGRESS" | "READY";
  readinessScore: number;
}

export interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: PlatformRole;
  organizationId?: string;
  organizationName?: string;
  status: UserStatus;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  entityType: "ORGANIZATION" | "USER" | "AUTH" | "PLATFORM";
  entityId: string;
  entityName: string;
  createdAt: string;
  ipAddress: string;
  metadata: Record<string, string>;
}

export interface DashboardMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  newUsersThisPeriod: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentOrganizations: Organization[];
  recentUsers: PlatformUser[];
  recentAuditEvents: AuditEvent[];
}

export interface AnalyticsPoint {
  label: string;
  organizations: number;
  users: number;
}

export interface RoleDistribution {
  role: PlatformRole;
  value: number;
}

export interface PlatformAnalyticsSummary {
  growth: AnalyticsPoint[];
  roleDistribution: RoleDistribution[];
  onboarding: {
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export interface OrganizationQuery {
  search?: string;
  status?: OrganizationStatus | "ALL";
  createdWindow?: "ALL" | "7D" | "30D" | "90D";
}

export interface UsersQuery {
  search?: string;
  role?: PlatformRole | "ALL";
  status?: UserStatus | "ALL";
  organizationId?: string | "ALL";
}

export interface AuditQuery {
  search?: string;
  entityType?: AuditEvent["entityType"] | "ALL";
  action?: string | "ALL";
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResult {
  token: string;
  user: PlatformUser;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description: string;
  status: OrganizationStatus;
}

export interface CreateOrganizationAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  temporaryPassword: string;
}

export interface OrganizationDetailData {
  organization: Organization;
  orgAdmins: PlatformUser[];
  recentUsers: PlatformUser[];
  recentAuditEvents: AuditEvent[];
  metadata: {
    tenantKey: string;
    readinessTier: "High" | "Medium" | "Low";
    lastPolicyReview: string;
  };
}

export interface PlatformUserDetailData {
  user: PlatformUser;
  recentAuditEvents: AuditEvent[];
}

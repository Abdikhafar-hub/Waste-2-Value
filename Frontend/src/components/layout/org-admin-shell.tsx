"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Bell,
  Box,
  ChartColumnBig,
  Coins,
  Factory,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Search,
  ShoppingCart,
  UserRoundCog,
  Users,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAuthSession } from "@/lib/auth-session";
import { cn, initials } from "@/lib/utils";

interface OrgAdminShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/org-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/org-admin/team", label: "Team", icon: Users },
  { href: "/org-admin/waste", label: "Waste", icon: PackageSearch },
  { href: "/org-admin/processing", label: "Processing", icon: Factory },
  { href: "/org-admin/inventory", label: "Inventory", icon: Box },
  { href: "/org-admin/products", label: "Products", icon: BadgeDollarSign },
  { href: "/org-admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/org-admin/wallet", label: "Wallet", icon: Coins },
  { href: "/org-admin/analytics", label: "Analytics", icon: ChartColumnBig },
  { href: "/org-admin/geo", label: "Geo", icon: Globe },
  { href: "/org-admin/account", label: "Account", icon: UserRoundCog },
];

function pageTitleFromPath(pathname: string) {
  const found = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return found?.label ?? "Operations";
}

function Sidebar({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="flex h-full w-[282px] flex-col border-r border-border bg-[#f9fcfa]">
      <div className="px-5 pt-5 pb-3">
        <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Waste2Value</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">Org Operations Hub</h2>
          <p className="mt-1 text-xs text-muted-foreground">Waste to value workflows for EcoLoop Nairobi.</p>
        </div>
      </div>

      <nav className="scrollbar-subtle flex-1 space-y-1 overflow-auto px-3 pb-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                active ? "bg-brand text-white shadow-xs" : "text-muted-foreground hover:bg-white hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 rounded-lg border border-border bg-white px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Organization</p>
          <p className="text-sm font-semibold text-foreground">EcoLoop Nairobi</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function OrgAdminShell({ children }: OrgAdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pageTitle = useMemo(() => pageTitleFromPath(pathname), [pathname]);
  const handleLogout = () => {
    clearAuthSession();
    setMobileNavOpen(false);
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f2f7f4] lg:p-4">
      <div className="flex min-h-screen w-full lg:min-h-[calc(100vh-2rem)] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-white lg:shadow-premium-lg">
        <div className="hidden xl:block">
          <Sidebar pathname={pathname} onLogout={handleLogout} />
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 bg-[#07120c]/45 xl:hidden" role="presentation">
            <div className="h-full w-[88%] max-w-xs">
              <Sidebar pathname={pathname} onNavigate={() => setMobileNavOpen(false)} onLogout={handleLogout} />
            </div>
            <button
              type="button"
              className="absolute inset-0 -z-10"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-5 lg:px-6">
              <Button variant="secondary" size="sm" className="xl:hidden" onClick={() => setMobileNavOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{pageTitle}</p>
                <p className="text-xs text-muted-foreground">Organization operations workspace</p>
              </div>

              <div className="relative ml-auto hidden w-full max-w-xl lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search submissions, users, orders..." className="pl-9" />
              </div>

              <span className="hidden rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-semibold text-foreground md:inline-flex">
                EcoLoop Nairobi
              </span>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-white text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-white px-2.5 py-1.5"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {initials("Joan", "Otieno")}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-foreground">Joan Otieno</span>
                  <span className="block text-[11px] text-muted-foreground">Org Admin</span>
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-7">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

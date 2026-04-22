"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Building2, ChartNoAxesCombined, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, UserRoundCog, Users } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAuthSession } from "@/lib/auth-session";
import { cn, initials } from "@/lib/utils";

interface SuperAdminShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizations", label: "Organizations", icon: Building2 },
  { href: "/users", label: "Platform Users", icon: Users },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/audit", label: "Audit Log", icon: ShieldCheck },
  { href: "/account", label: "Account", icon: UserRoundCog },
];

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
    <aside className="flex h-full w-72 flex-col border-r border-border bg-white/95 backdrop-blur">
      <div className="px-5 pt-5 pb-4">
        <div className="rounded-xl border border-border bg-gradient-to-br from-white to-surface-soft p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Waste2Value</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">Platform Control Center</h2>
          <p className="mt-1 text-xs text-muted-foreground">Super admin oversight for circular economy infrastructure.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-soft hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function pageTitleFromPath(pathname: string) {
  const found = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (found) {
    return found.label;
  }

  return "Platform";
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
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
    <div className="min-h-screen bg-[#f3f7f5] lg:p-4">
      <div className="flex min-h-screen w-full lg:min-h-[calc(100vh-2rem)] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-white lg:shadow-premium-lg">
        <div className="hidden xl:block">
          <Sidebar pathname={pathname} onLogout={handleLogout} />
        </div>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 bg-[#07120c]/45 xl:hidden" role="presentation">
            <div className="h-full w-[86%] max-w-xs">
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
          <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-5 lg:px-6">
              <Button variant="secondary" size="sm" className="xl:hidden" onClick={() => setMobileNavOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{pageTitle}</p>
                <p className="text-xs text-muted-foreground">Super admin workspace</p>
              </div>

              <div className="relative ml-auto hidden w-full max-w-xl md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Quick search..." className="pl-9" />
              </div>

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
                  {initials("Amina", "Odede")}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-foreground">Amina Odede</span>
                  <span className="block text-[11px] text-muted-foreground">Super Admin</span>
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  CircleUserRound,
  ClipboardList,
  Home,
  Leaf,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { clearAuthSession } from "@/lib/auth-session";
import { Input } from "@/components/ui/input";
import { cn, initials } from "@/lib/utils";

interface CollectorShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/collector/dashboard", label: "Home", icon: Home },
  { href: "/collector/submissions", label: "Submissions", icon: ClipboardList },
  { href: "/collector/wallet", label: "Wallet", icon: BadgeDollarSign },
  { href: "/collector/reputation", label: "Reputation", icon: Sparkles },
  { href: "/collector/account", label: "Account", icon: CircleUserRound },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/collector/submissions/new")) {
    return "New Submission";
  }

  if (pathname.startsWith("/collector/submissions/")) {
    return "Submission Detail";
  }

  const found = navItems.find((item) => isActive(pathname, item.href));
  return found?.label ?? "Collector";
}

export function CollectorShell({ children }: CollectorShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const handleLogout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f5faf7]">
      <div className="flex min-h-screen lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-white/90 lg:flex lg:flex-col">
          <div className="px-4 pt-4 pb-3">
            <div className="rounded-xl border border-border bg-gradient-to-br from-white to-surface-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Waste2Value</p>
              <p className="mt-1 text-base font-semibold text-foreground">Collector Field Hub</p>
              <p className="mt-1 text-xs text-muted-foreground">Fast field submissions and credit tracking.</p>
            </div>
          </div>

          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    active ? "bg-brand text-white" : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border p-3">
            <div className="rounded-lg border border-border bg-surface-soft px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Assigned Zone</p>
              <p className="text-sm font-semibold text-foreground">Central</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-surface-soft hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Leaf className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">EcoLoop Nairobi • Collector Workspace</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-9 w-[220px] pl-9" placeholder="Quick search" />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-border text-xs font-semibold text-brand">
                  {initials("Brian", "Mwangi")}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pb-24 sm:px-5 sm:py-5 sm:pb-24 lg:pb-6">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/98 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg py-1.5 text-[11px] font-semibold transition",
                  active ? "bg-brand-soft text-brand" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("mb-1 h-4 w-4", active ? "text-brand" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

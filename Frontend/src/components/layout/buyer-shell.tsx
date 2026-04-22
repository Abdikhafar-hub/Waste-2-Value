"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleUserRound,
  Home,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { clearAuthSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, initials } from "@/lib/utils";

interface BuyerShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/buyer/dashboard", label: "Home", icon: Home },
  { href: "/buyer/marketplace", label: "Marketplace", icon: Store },
  { href: "/buyer/orders", label: "Orders", icon: ShoppingBag },
  { href: "/buyer/account", label: "Account", icon: CircleUserRound },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/buyer/marketplace/")) {
    return "Product Detail";
  }

  if (pathname.startsWith("/buyer/orders/")) {
    return "Order Detail";
  }

  const found = navItems.find((item) => isActive(pathname, item.href));
  return found?.label ?? "Buyer";
}

export function BuyerShell({ children }: BuyerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const title = useMemo(() => resolveTitle(pathname), [pathname]);
  const handleLogout = () => {
    clearAuthSession();
    setMobileNavOpen(false);
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f8f6]">
      <div className="flex min-h-screen lg:grid lg:grid-cols-[242px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-white/92 lg:flex lg:flex-col">
          <div className="px-4 pt-4 pb-3">
            <div className="rounded-xl border border-border bg-gradient-to-br from-white to-surface-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Waste2Value</p>
              <p className="mt-1 text-base font-semibold text-foreground">Buyer Marketplace</p>
              <p className="mt-1 text-xs text-muted-foreground">Trusted recycled output procurement workspace.</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Organization</p>
              <p className="text-sm font-semibold text-foreground">GreenMart Supplies</p>
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

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 bg-[#07120c]/45 lg:hidden" role="presentation">
            <div className="h-full w-[86%] max-w-xs bg-white p-3">
              <div className="rounded-xl border border-border bg-gradient-to-br from-white to-surface-soft p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Waste2Value</p>
                <p className="mt-1 text-base font-semibold text-foreground">Buyer Marketplace</p>
                <p className="mt-1 text-xs text-muted-foreground">Trusted procurement workspace.</p>
              </div>

              <nav className="mt-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-brand text-white"
                          : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground")} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-surface-soft hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
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
          <header className="sticky top-0 z-30 border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ShoppingCart className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">GreenMart Supplies • Buyer Workspace</p>
              </div>

              <div className="relative ml-auto hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-9 w-[230px] pl-9" placeholder="Search products or orders" />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>

              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-brand">
                {initials("Amina", "Njoroge")}
              </span>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pb-24 sm:px-5 sm:py-5 sm:pb-24 lg:pb-6">
            <div className="w-full">{children}</div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/98 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
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

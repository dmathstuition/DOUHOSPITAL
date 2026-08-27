'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut, Search, Bell } from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { DashboardRail } from '@/components/layout/dashboard-rail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { can, ROLE_LABELS, ROLES, type Role } from '@/lib/rbac';
import { railForRole, type NavItem } from '@/lib/nav';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function DashboardShell({
  items,
  user,
  children,
}: {
  items: NavItem[];
  user: { fullName: string | null; email: string | null; role: Role };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const router = useRouter();
  const displayName = user.fullName ?? user.email ?? 'User';
  const railItems = railForRole(user.role);
  const canSearch = can(user.role, 'SEARCH_PATIENTS');
  const canNotify = user.role === ROLES.SUPER_ADMIN;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/patients?q=${encodeURIComponent(q)}` : '/patients');
  }

  return (
    <div className="min-h-screen bg-brand-soft bg-muted/20">
      {/* Desktop two-tier sidebar: brand icon rail + labelled panel */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 lg:block">
        <DashboardRail items={railItems} />
      </aside>
      <aside className="fixed inset-y-0 left-16 z-20 hidden w-60 border-r bg-background lg:block">
        <DashboardSidebar items={items} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-background shadow-xl">
            <div className="flex justify-end p-2">
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DashboardSidebar items={items} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn('lg:pl-[304px]')}>
        {/* Topbar */}
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4">
          <button
            className="rounded-md p-2 hover:bg-accent lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {canSearch && (
            <form
              onSubmit={submitSearch}
              className="relative hidden w-full max-w-xs md:block"
              role="search"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search patients…"
                aria-label="Search patients"
                className="h-10 w-full rounded-full border border-transparent bg-muted/60 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/30 focus:bg-background"
              />
            </form>
          )}

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {canNotify && (
              <Link
                href="/dashboard/notifications"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </Link>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName}</p>
              <Badge variant="secondary" className="mt-0.5">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
              {initials(user.fullName?.split(' ')[0], user.fullName?.split(' ')[1]) || 'U'}
            </span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>

        <main id="main-content" className="bg-dot-grid animate-fade-in min-h-[calc(100vh-4rem)] overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

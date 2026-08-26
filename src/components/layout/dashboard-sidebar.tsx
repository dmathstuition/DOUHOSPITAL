'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { navIcon } from '@/components/layout/dashboard-nav-icons';
import type { NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function DashboardSidebar({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Logo withText={false} />
        <span className="ml-2 font-bold text-primary">DOUHC</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard">
        {items.map((item) => {
          const Icon = navIcon(item.icon);
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-gradient text-primary-foreground shadow-glow'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

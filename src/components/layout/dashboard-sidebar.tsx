'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Phone } from 'lucide-react';
import { navIcon } from '@/components/layout/dashboard-nav-icons';
import { groupedNav, type NavItem } from '@/lib/nav';
import { siteConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

/**
 * The labelled navigation panel — grouped sections plus a health-center
 * profile card at the foot. Used on desktop (beside the icon rail) and inside
 * the mobile drawer.
 */
export function DashboardSidebar({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = groupedNav(items);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="text-lg font-bold text-primary">Health Center</span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Dashboard">
        {groups.map(({ group, items: groupItems }) => (
          <div key={group}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group}
            </p>
            <div className="space-y-1">
              {groupItems.map((item) => {
                const Icon = navIcon(item.icon);
                const active = isActive(pathname, item.href);
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
            </div>
          </div>
        ))}
      </nav>

      {/* Health-center profile card */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl border bg-brand-soft p-4 shadow-soft">
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
              <Image
                src="/images/university-logo.jpg"
                alt="DOU crest"
                width={40}
                height={40}
                className="h-full w-full object-contain p-0.5"
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{siteConfig.shortName}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {siteConfig.contact.emergencyPhone}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="mt-3 block rounded-lg bg-primary/10 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            Health Center Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { navIcon } from '@/components/layout/dashboard-nav-icons';
import type { NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

/**
 * Slim brand rail — the crest, icon shortcuts to the day-to-day sections, and
 * sign-out. Desktop only; the mobile drawer uses the labelled panel instead.
 */
export function DashboardRail({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col items-center gap-1 bg-brand-gradient py-3 text-primary-foreground">
      <Link
        href="/dashboard"
        aria-label="DOUHC home"
        className="mb-2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-black/10"
      >
        <Image
          src="/images/university-logo.jpg"
          alt="Dennis Osadebay University crest"
          width={44}
          height={44}
          className="h-full w-full object-contain p-1"
          priority
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Quick navigation">
        {items.map((item) => {
          const Icon = navIcon(item.icon);
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              aria-label={item.title}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                active
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-primary-foreground/70 hover:bg-white/10 hover:text-white',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />
              )}
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <form action="/auth/signout" method="post" className="mt-1">
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

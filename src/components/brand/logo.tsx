import Link from 'next/link';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

/**
 * DOUHC logo lockup. Uses a text-based mark that renders even before the real
 * logo asset (public/images/douhc-logo.png) is supplied, so the brand is never
 * broken. Swap in the image by uncommenting the <Image /> block once available.
 */
export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <Link href="/" className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-primary-foreground"
      >
        DH
      </span>
      {withText && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold text-primary">
            {siteConfig.shortName}
          </span>
          <span className="hidden text-[11px] text-muted-foreground sm:block">
            Dennis Osadebay University Health Center
          </span>
        </span>
      )}
    </Link>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

/**
 * DOUHC logo lockup — the Dennis Osadebay University crest plus the health
 * center wordmark.
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-black/5">
        <Image
          src="/images/university-logo.jpg"
          alt="Dennis Osadebay University crest"
          width={40}
          height={40}
          className="h-full w-full object-contain p-0.5"
          priority
        />
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

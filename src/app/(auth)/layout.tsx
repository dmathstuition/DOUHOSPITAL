import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { siteConfig } from '@/lib/config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-brand-soft bg-muted/30">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <header className="glass sticky top-0 z-10 border-b">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to website
          </Link>
        </div>
      </header>
      <main id="main-content" className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </main>
      <footer className="border-t bg-background py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.shortName}
      </footer>
    </div>
  );
}

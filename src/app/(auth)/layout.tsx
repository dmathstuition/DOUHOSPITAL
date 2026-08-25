import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { siteConfig } from '@/lib/config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to website
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="border-t bg-background py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.shortName}
      </footer>
    </div>
  );
}

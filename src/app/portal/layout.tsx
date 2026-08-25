import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth';
import { isStaff } from '@/lib/rbac';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Staff use the dashboard, not the patient portal.
  if (isStaff(user.role)) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge variant="secondary">Patient Portal</Badge>
          </div>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
      <footer className="border-t bg-background py-4 text-center text-xs text-muted-foreground">
        Need help? <Link href="/contact" className="text-primary hover:underline">Contact the health center</Link>
      </footer>
    </div>
  );
}

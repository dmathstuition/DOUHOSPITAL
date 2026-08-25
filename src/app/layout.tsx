import type { Metadata, Viewport } from 'next';
import './globals.css';
import { siteConfig } from '@/lib/config';

/** Never let a malformed URL break the build/metadata collection. */
function safeUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export const metadata: Metadata = {
  metadataBase: safeUrl(siteConfig.url),
  title: {
    default: `${siteConfig.name} (${siteConfig.shortName})`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.shortName,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    type: 'website',
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.shortName,
    url: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#1c5c40',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

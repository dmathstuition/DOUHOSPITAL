import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Never expose authenticated/health areas to crawlers.
      disallow: ['/dashboard', '/portal', '/admin', '/patients', '/auth'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

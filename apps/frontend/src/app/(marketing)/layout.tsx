import { GridBackground } from '@/components/marketing/grid-background';
import { SiteNav } from '@/components/marketing/site-nav';
import { SiteFooter } from '@/components/marketing/site-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell relative min-h-screen flex flex-col">
      <GridBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}

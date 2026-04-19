import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getServerApi } from '@/lib/api.server';
import { Topbar } from '@/components/app-shell/topbar';
import { API_ENDPOINTS } from '@klaro/shared';
import type { BankProfile } from '@klaro/shared';
import { BankNav } from '@/components/bank/bank-nav';
import { BankMobileHeader } from '@/components/bank/bank-mobile-header';

export default async function BankLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('bank');
  const api = await getServerApi();

  let bank: BankProfile | null = null;
  try {
    bank = await api.get<BankProfile>(API_ENDPOINTS.bank.me);
  } catch {
    bank = null;
  }

  const bankName = bank?.name ?? 'Klaro · Bank';
  const bankInitial = bankName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile header (hidden on lg+) */}
      <BankMobileHeader
        bankName={bankName}
        bankInitial={bankInitial}
        logoUrl={bank?.logoUrl}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (hidden below lg) */}
        <aside className="hidden w-60 shrink-0 flex-col border-r lg:flex">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            {bank?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bank.logoUrl}
                alt={bankName}
                className="h-8 w-8 rounded object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                {bankInitial}
              </div>
            )}
            <Link href="/bank" className="min-w-0 text-sm font-bold tracking-tight leading-tight">
              <div className="truncate">{bankName}</div>
              <div className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                Portal
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <BankNav />
          </div>

          {/* Sidebar footer */}
          <div className="border-t p-4">
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar email={user.email} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

import { requireRole } from '@/lib/auth';
import { Topbar } from '@/components/app-shell/topbar';
import { BankSidebar } from '@/components/app-shell/bank-sidebar';

export default async function BankLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('bank');

  return (
    <div className="app-gradient min-h-screen flex">
      <BankSidebar />
      <div className="flex flex-1 flex-col lg:pl-60 min-w-0">
        <Topbar email={user.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

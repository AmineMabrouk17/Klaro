import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Topbar } from '@/components/app-shell/topbar';
import { BottomNav } from '@/components/app-shell/bottom-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="app-gradient min-h-screen">
      <Sidebar />
      <div className="lg:pl-60 flex flex-col min-h-screen relative z-10 isolate min-w-0">
        <Topbar email={user.email} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

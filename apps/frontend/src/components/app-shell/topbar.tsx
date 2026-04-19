'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  email?: string | null;
}

export function Topbar({ email }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between px-4 hairline-b bg-[hsl(var(--marketing-bg))]/85 backdrop-blur-md lg:pl-6">
      <span className="lg:hidden text-[15px] font-semibold tracking-tight text-white">
        Klaro
      </span>

      <div className="hidden lg:flex items-center gap-2">
        <span className="status-dot" />
        <span className="mono text-[11px] tracking-[0.16em] uppercase text-white/55">
          {email ?? 'signed in'}
        </span>
      </div>

      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ y: 0 }}
        onClick={signOut}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 mono text-[11px] tracking-[0.16em] uppercase text-white/55 hover:text-white hairline hover:bg-white/[0.04] transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
        <span>Sign out</span>
      </motion.button>
    </header>
  );
}

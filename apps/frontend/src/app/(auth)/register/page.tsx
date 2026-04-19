'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Check your email to confirm your account');
    router.push('/login');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      className="hairline rounded-2xl bg-white/[0.025] p-8 space-y-6 backdrop-blur-sm"
    >
      <div className="space-y-2">
        <div className="mono text-[10.5px] tracking-[0.18em] uppercase text-white/55">
          Create account
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Start your real
          <br />
          financial story.
        </h1>
        <p className="text-sm text-white/55">
          Five minutes to your first score. Free to start.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Full name">
          <Input
            id="full_name"
            autoComplete="name"
            required
            placeholder="Amen Dhahri"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11"
          />
        </Field>
        <Field label="Email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </Field>
        <Field label="Password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
        </Field>
        <Button type="submit" className="w-full h-11" disabled={busy}>
          {busy ? 'Creating account…' : (
            <>
              Create account
              <span aria-hidden>→</span>
            </>
          )}
        </Button>
      </form>

      <p className="mono text-[10.5px] tracking-[0.16em] uppercase text-white/35 text-center">
        By signing up you agree to our terms & privacy
      </p>

      <div className="hairline-t pt-4 text-center text-sm text-white/55">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-white hover:underline underline-offset-4 font-medium"
        >
          Sign in
        </Link>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="mono text-[10.5px] tracking-[0.18em] uppercase text-white/55">
        {label}
      </Label>
      {children}
    </div>
  );
}

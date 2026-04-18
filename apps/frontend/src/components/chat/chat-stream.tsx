'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { ChatRole } from '@klaro/shared';

type ChatMode = 'spending_analysis' | 'habit_insights' | 'score_tips' | 'general';

interface UiMessage {
  id: string;
  role: ChatRole;
  content: string;
  streaming?: boolean;
}

const MODES: { id: ChatMode; label: string; description: string }[] = [
  { id: 'general', label: 'Ask anything', description: 'General financial advice' },
  { id: 'spending_analysis', label: 'Spending', description: 'Analyze your spending' },
  { id: 'habit_insights', label: 'Habits', description: 'Reveal your patterns' },
  { id: 'score_tips', label: 'Score tips', description: 'Improve your score' },
];

const MODE_PLACEHOLDERS: Record<ChatMode, string> = {
  general: 'Ask about your score, spending, or anything financial…',
  spending_analysis: 'Ask about your spending breakdown…',
  habit_insights: 'Ask about your financial habits and patterns…',
  score_tips: 'Ask how to improve your Klaro score…',
};

export function ChatStream() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I am your Klaro advisor. I can analyze your spending, reveal your financial habits, or give you a personalized plan to improve your score. Select a mode below or just ask me anything.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ChatMode>('general');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || busy) return;
      setInput('');
      setBusy(true);

      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      setMessages((m) => [
        ...m,
        { id: userMsgId, role: 'user', content: text },
        { id: assistantMsgId, role: 'assistant', content: '', streaming: true },
      ]);

      try {
        // Get the Supabase session token for Authorization header.
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: 'Please log in to use the advisor.', streaming: false }
                : msg,
            ),
          );
          return;
        }

        const params = new URLSearchParams({ message: text, mode });
        const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stream?${params.toString()}`;

        abortRef.current = new AbortController();
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Stream error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE lines end with \n\n; process complete events.
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const eventStr of events) {
            const dataLine = eventStr.split('\n').find((l) => l.startsWith('data: '));
            if (!dataLine) continue;
            try {
              const chunk = JSON.parse(dataLine.slice(6)) as {
                type: string;
                content?: string;
                error?: string;
              };
              if (chunk.type === 'delta' && chunk.content) {
                fullContent += chunk.content;
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: fullContent }
                      : msg,
                  ),
                );
              } else if (chunk.type === 'error') {
                fullContent = chunk.error ?? 'Something went wrong.';
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: fullContent, streaming: false }
                      : msg,
                  ),
                );
              } else if (chunk.type === 'done') {
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, streaming: false } : msg,
                  ),
                );
              }
            } catch {
              // Ignore malformed SSE lines.
            }
          }
        }

        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, streaming: false } : msg,
          ),
        );
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: 'Failed to get a response. Please try again.', streaming: false }
              : msg,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [input, busy, mode],
  );

  return (
    <div className="flex h-[75vh] flex-col gap-3">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              mode === m.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50'
            }`}
            title={m.description}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border p-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content || (m.streaming ? '…' : '')}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form onSubmit={send} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={MODE_PLACEHOLDERS[mode]}
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          {busy ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}

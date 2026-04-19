import { ChatStream } from '@/components/chat/chat-stream';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatSessionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { q } = await searchParams;
  return <ChatStream sessionId={id} initialPrompt={q} />;
}

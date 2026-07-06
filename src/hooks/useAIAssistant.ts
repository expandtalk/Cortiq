import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  isLoading?: boolean;
  isError?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function useAIAssistant(siteId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    };

    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Build history from existing messages (exclude loading placeholder)
      const history = messages
        .filter(m => !m.isLoading && !m.isError)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text.trim(), siteId, history }),
      });

      const data = await res.json() as { response?: string; toolsUsed?: string[]; error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Request failed');
      }

      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: data.response ?? '', toolsUsed: data.toolsUsed, isLoading: false }
            : m,
        ),
      );
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev =>
        prev.map(m =>
          m.isLoading
            ? { ...m, content: errorText, isLoading: false, isError: true }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, siteId]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}

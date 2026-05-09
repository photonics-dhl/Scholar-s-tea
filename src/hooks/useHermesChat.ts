'use client';

import { useState, useCallback, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type HermesMode = 'kawaii' | 'community_manager';

const WELCOME_MESSAGES: Record<HermesMode, ChatMessage> = {
  kawaii: {
    role: 'assistant',
    content: '你好！我是 Hermes，你的常驻 AI 助手。有什么我可以帮你的吗？',
  },
  community_manager: {
    role: 'assistant',
    content: '你好，管理员！我是 Hermes 的社区管家模式。我可以帮你分析社区数据、评估内容质量、提供运营建议。有什么需要我协助的吗？',
  },
};

export function useHermesChat(initialMode: HermesMode = 'kawaii') {
  const [mode, setModeState] = useState<HermesMode>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGES[initialMode]]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>(`web-${Date.now()}`);
  const abortRef = useRef<AbortController | null>(null);

  const setMode = useCallback((newMode: HermesMode) => {
    setModeState(newMode);
    setMessages([WELCOME_MESSAGES[newMode]]);
    sessionIdRef.current = `web-${Date.now()}`;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = { role: 'user', content: content.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Add placeholder for assistant response
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      try {
        const response = await fetch('/api/v1/hermes/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
            sessionId: sessionIdRef.current,
            mode: mode === 'community_manager' ? 'community_manager' : undefined,
          }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('需要管理员权限才能使用社区管家模式');
          }
          throw new Error('Request failed');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: fullContent,
                      };
                      return newMessages;
                    });
                  }
                } catch {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Hermes chat error:', error);
        const errorMsg =
          error instanceof Error ? error.message : '抱歉，连接出现了一些问题，请稍后再试。';
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: errorMsg,
          };
          return newMessages;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, mode]
  );

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGES[mode]]);
    sessionIdRef.current = `web-${Date.now()}`;
  }, [mode]);

  return {
    messages,
    isLoading,
    mode,
    setMode,
    sendMessage,
    clearMessages,
  };
}

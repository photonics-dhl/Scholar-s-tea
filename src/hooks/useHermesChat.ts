'use client';

import { useState, useCallback, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type HermesMode = 'kawaii' | 'community_manager';
export type HermesPersonality =
  | 'kawaii'
  | 'technical'
  | 'teacher'
  | 'analyst'
  | 'creative'
  | 'professor'
  | 'helpful';

const WELCOME_MESSAGES: Record<HermesMode, Record<HermesPersonality, string>> = {
  kawaii: {
    kawaii: '你好！我是 Hermes，你的常驻 AI 助手。有什么我可以帮你的吗？',
    technical: '你好，我是 Hermes 技术专家模式。遇到代码或系统问题？直接告诉我。',
    teacher: '你好，我是 Hermes 导师模式。有任何学习上的问题，我们一起探讨！',
    analyst: '你好，我是 Hermes 分析师模式。需要数据分析或逻辑梳理？我来帮你。',
    creative: '你好，我是 Hermes 创意模式。想 brainstorm 或寻找灵感？随时开始！',
    professor: '你好，我是 Hermes 教授模式。学术问题、理论探讨，欢迎交流。',
    helpful: '你好！我是 Hermes，你的常驻 AI 助手。有什么我可以帮你的吗？',
  },
  community_manager: {
    kawaii: '你好，管理员！我是 Hermes 的社区管家模式。我可以帮你分析社区数据、评估内容质量、提供运营建议。有什么需要我协助的吗？',
    technical: '你好，管理员！我是 Hermes 社区管家（技术模式）。专注于社区技术架构和数据运营分析。',
    teacher: '你好，管理员！我是 Hermes 社区管家（导师模式）。帮你梳理社区运营策略，循序渐进。',
    analyst: '你好，管理员！我是 Hermes 社区管家（分析师模式）。基于数据为你提供社区健康度报告。',
    creative: '你好，管理员！我是 Hermes 社区管家（创意模式）。帮你策划有趣的社区活动方案。',
    professor: '你好，管理员！我是 Hermes 社区管家（教授模式）。用学术严谨的态度分析社区运营。',
    helpful: '你好，管理员！我是 Hermes 的社区管家模式。我可以帮你分析社区数据、评估内容质量、提供运营建议。有什么需要我协助的吗？',
  },
};

export function useHermesChat(
  initialMode: HermesMode = 'kawaii',
  initialPersonality: HermesPersonality = 'kawaii'
) {
  const [mode, setModeState] = useState<HermesMode>(initialMode);
  const [personality, setPersonalityState] = useState<HermesPersonality>(initialPersonality);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGES[initialMode][initialPersonality] },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>(`web-${Date.now()}`);
  const abortRef = useRef<AbortController | null>(null);

  const setMode = useCallback((newMode: HermesMode) => {
    setModeState(newMode);
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGES[newMode][personality] }]);
    sessionIdRef.current = `web-${Date.now()}`;
  }, [personality]);

  const setPersonality = useCallback((newPersonality: HermesPersonality) => {
    setPersonalityState(newPersonality);
    setMessages([
      { role: 'assistant', content: WELCOME_MESSAGES[mode][newPersonality] },
    ]);
    sessionIdRef.current = `web-${Date.now()}`;
  }, [mode]);

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
            personality: personality !== 'kawaii' ? personality : undefined,
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
              // Handle custom SSE events from Hermes backend (e.g. hermes.tool.progress)
              // We silently ignore them since user doesn't need to see tool calls
              if (line.startsWith('event:')) {
                continue;
              }
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
    [messages, isLoading, mode, personality]
  );

  const clearMessages = useCallback(() => {
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGES[mode][personality] }]);
    sessionIdRef.current = `web-${Date.now()}`;
  }, [mode, personality]);

  return {
    messages,
    isLoading,
    mode,
    setMode,
    personality,
    setPersonality,
    sendMessage,
    clearMessages,
  };
}

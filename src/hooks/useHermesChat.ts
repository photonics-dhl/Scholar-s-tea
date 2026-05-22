'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/** 单条消息内容：纯文本或多模态（OpenAI 格式） */
export type MessageContent = string | Array<
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** UI 展示用的图片 base64（不在 API 历史中保留原图） */
  imageData?: string;
}

/** 内存优化：最大保留消息数（含系统欢迎消息） */
const MAX_MESSAGES = 32;
/** SSE 节流间隔：每 N ms 更新一次 UI，减少 React 重渲染 */
const SSE_THROTTLE_MS = 80;
/** 单条消息最大字符数，超出截断 */
const MAX_MESSAGE_CHARS = 8000;
/** 图片最大尺寸（像素） */
const MAX_IMAGE_DIM = 1024;
/** 图片压缩质量 */
const IMAGE_QUALITY = 0.8;

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

/** 将图片文件压缩并转为 base64 */
export async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
        const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
      resolve(base64);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/** 截断过长消息，保留首尾关键信息 */
function truncateMessage(content: string, maxLen: number): string {
  if (content.length <= maxLen) return content;
  const headLen = Math.floor(maxLen * 0.6);
  const tailLen = maxLen - headLen - 12;
  return content.slice(0, headLen) + '\n...[内容过长，已截断]...\n' + content.slice(-tailLen);
}

/** 限制消息历史长度，保留最近 N 条 */
function trimMessages(msgs: ChatMessage[], maxCount: number): ChatMessage[] {
  if (msgs.length <= maxCount) return msgs;
  // 始终保留第一条（欢迎消息）和最近 maxCount-1 条
  return [msgs[0], ...msgs.slice(-(maxCount - 1))];
}

/** 将 ChatMessage 转为 API 多模态格式 */
function toApiMessage(msg: ChatMessage): { role: 'user' | 'assistant' | 'system'; content: MessageContent } {
  // 只有用户消息且带图片时才用多模态格式
  if (msg.role === 'user' && msg.imageData) {
    return {
      role: 'user',
      content: [
        { type: 'text', text: msg.content },
        { type: 'image_url', image_url: { url: msg.imageData } },
      ],
    };
  }
  return { role: msg.role, content: msg.content };
}

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
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(`web-${Date.now()}`);
  const abortRef = useRef<AbortController | null>(null);
  // SSE 节流：用 ref 累积内容，定时批量更新
  const sseBufferRef = useRef('');
  const sseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContentRef = useRef('');

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (sseTimerRef.current) {
        clearTimeout(sseTimerRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const setMode = useCallback((newMode: HermesMode) => {
    setModeState(newMode);
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGES[newMode][personality] }]);
    setToolStatus(null);
    sessionIdRef.current = `web-${Date.now()}`;
  }, [personality]);

  const setPersonality = useCallback((newPersonality: HermesPersonality) => {
    setPersonalityState(newPersonality);
    setMessages([
      { role: 'assistant', content: WELCOME_MESSAGES[mode][newPersonality] },
    ]);
    setToolStatus(null);
    sessionIdRef.current = `web-${Date.now()}`;
  }, [mode]);

  // 根据用户消息内容，高置信度场景下自动添加工具调用提示
  const enhanceMessageWithToolHint = (content: string): string => {
    const trimmed = content.trim();
    // 如果用户已经明确要求使用工具，不再添加前缀
    if (/use\s+(the\s+)?\w+\s+tool/i.test(trimmed)) return trimmed;

    // 搜索类意图 → 优先用 skills_list 查找搜索技能（更可靠）
    if (/^(搜索|查一下?|找一下?|搜一下?|查询|查找|有没有|什么是|最新|最近|当前|today|latest|recent|search for|look up|find|what is|what are)/i.test(trimmed)) {
      return `请使用 skills_list 查看可用的搜索技能，然后使用合适的技能来查找：${trimmed}`;
    }
    // 访问网页类意图
    if (/^(打开|访问|查看|去|browse|visit|go to|check|look at)\s+/i.test(trimmed) && /https?:\/\//.test(trimmed)) {
      return `请使用 browser_navigate 工具访问以下网页：${trimmed}`;
    }
    // 代码执行类意图
    if (/^(运行|执行|计算|写个?代码|run|execute|calculate|compute|write code|code:)/i.test(trimmed)) {
      return `请使用 execute_code 工具执行以下请求：${trimmed}`;
    }
    // 任务规划类意图
    if (/^(规划|列出|创建任务|todo|plan|create a list|make a plan)/i.test(trimmed)) {
      return `请使用 todo 工具处理以下请求：${trimmed}`;
    }
    return trimmed;
  };

  const sendMessage = useCallback(
    async (content: string, imageData?: string) => {
      if ((!content.trim() && !imageData) || isLoading) return;

      const originalContent = content.trim() || (imageData ? '请描述这张图片' : '');
      const enhancedContent = imageData ? originalContent : enhanceMessageWithToolHint(originalContent);
      const userMessage: ChatMessage = { role: 'user', content: originalContent, imageData };
      // 发送给 API 的是增强后的内容，但 UI 仍显示原始内容
      const apiMessage: ChatMessage = { role: 'user', content: enhancedContent, imageData };

      // 先截断过长消息，再添加到状态
      const safeUserMsg = { ...userMessage, content: truncateMessage(userMessage.content, MAX_MESSAGE_CHARS) };
      const safeApiMsg = { ...apiMessage, content: truncateMessage(apiMessage.content, MAX_MESSAGE_CHARS) };

      setMessages((prev) => {
        const next: ChatMessage[] = [...prev, safeUserMsg];
        return trimMessages(next, MAX_MESSAGES);
      });
      setIsLoading(true);
      setToolStatus(null);

      // Add placeholder for assistant response
      setMessages((prev) => {
        const next: ChatMessage[] = [...prev, { role: 'assistant', content: '' }];
        return trimMessages(next, MAX_MESSAGES);
      });

      // 清理上一次的 SSE 缓冲区
      sseBufferRef.current = '';
      pendingContentRef.current = '';
      if (sseTimerRef.current) {
        clearTimeout(sseTimerRef.current);
        sseTimerRef.current = null;
      }

      // 准备发送给 API 的消息历史（同样截断）
      // 图片消息仅保留最近一条的多模态格式，其余历史消息转为纯文本
      const historyForApi = trimMessages(
        [...messages.map(m => ({ ...m, content: truncateMessage(m.content, MAX_MESSAGE_CHARS) })), safeApiMsg],
        MAX_MESSAGES
      );

      try {
        const abortController = new AbortController();
        abortRef.current = abortController;

        const response = await fetch('/api/v1/hermes/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          signal: abortController.signal,
          body: JSON.stringify({
            messages: historyForApi.map(toApiMessage),
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
          throw new Error(`请求失败 (${response.status})`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        // 节流更新函数
        const flushSSE = () => {
          if (sseTimerRef.current) {
            clearTimeout(sseTimerRef.current);
            sseTimerRef.current = null;
          }
          const contentToRender = pendingContentRef.current;
          if (contentToRender) {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: contentToRender,
              };
              return newMessages;
            });
          }
        };

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              // 解析 event 行，提取工具调用状态
              if (line.startsWith('event:')) {
                const eventName = line.slice(6).trim();
                if (eventName === 'hermes.tool.progress' || eventName === 'hermes.tool.start') {
                  setToolStatus('正在执行工具...');
                } else if (eventName === 'hermes.tool.complete' || eventName === 'hermes.tool.end') {
                  setToolStatus(null);
                }
                continue;
              }
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  // 处理工具调用状态的 data payload
                  if (parsed.tool?.name) {
                    setToolStatus(`正在使用 ${parsed.tool.name}...`);
                    continue;
                  }
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    pendingContentRef.current = fullContent;
                    // 节流：不立即 setState，而是设置定时器
                    if (!sseTimerRef.current) {
                      sseTimerRef.current = setTimeout(() => {
                        sseTimerRef.current = null;
                        flushSSE();
                      }, SSE_THROTTLE_MS);
                    }
                  }
                } catch {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        }
        // 流结束后强制刷新剩余内容
        flushSSE();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
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
        setToolStatus(null);
        if (sseTimerRef.current) {
          clearTimeout(sseTimerRef.current);
          sseTimerRef.current = null;
        }
        abortRef.current = null;
      }
    },
    [messages, isLoading, mode, personality]
  );

  const clearMessages = useCallback(() => {
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGES[mode][personality] }]);
    setToolStatus(null);
    sessionIdRef.current = `web-${Date.now()}`;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [mode, personality]);

  return {
    messages,
    isLoading,
    toolStatus,
    mode,
    setMode,
    personality,
    setPersonality,
    sendMessage,
    clearMessages,
  };
}

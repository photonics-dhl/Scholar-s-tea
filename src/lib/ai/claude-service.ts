import { prisma } from '@/lib/db/prisma';

// Proxy support for server-side fetch
let _fetch: typeof fetch = fetch;
let _agent: any = undefined;
if (typeof window === 'undefined') {
  const proxyUrl = process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (proxyUrl) {
    try {
      const nodeFetch = require('node-fetch');
      const { HttpsProxyAgent } = require('https-proxy-agent');
      _fetch = nodeFetch.default || nodeFetch;
      _agent = new HttpsProxyAgent(proxyUrl);
    } catch {
      // Fallback to native fetch
    }
  }
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ClaudeResponse {
  content: string;
  error?: string;
}

const SYSTEM_PROMPT = `你是一位博学的研究助手，专注于学术讨论和研究支持。

你的能力包括：
- 解释复杂的学术概念和研究方法
- 分析和讨论学术论文
- 提供研究思路和方法论建议
- 帮助理解和应用研究理论

请用中文回答，保持专业且友好的语气。如果不确定某些事情，请如实说明。`;

export async function chatWithAI(messages: ChatMessage[]): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { content: '', error: 'AI 服务未配置' };
  }

  try {
    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return { content: '', error: `AI 服务错误: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    console.error('AI chat error:', error);
    return { content: '', error: error instanceof Error ? error.message : '未知错误' };
  }
}

interface ResearchContext {
  papers?: Array<{
    title: string;
    abstract?: string;
    authors?: string[];
    year?: number;
  }>;
  discipline?: string;
}

export async function chatWithContext(
  messages: ChatMessage[],
  context: ResearchContext
): Promise<ClaudeResponse> {
  const contextPrompt = context.discipline
    ? `\n用户所在学科领域: ${context.discipline}`
    : '';

  const papersPrompt = context.papers && context.papers.length > 0
    ? `\n相关论文参考:\n${context.papers.map(p =>
        `- ${p.title}${p.authors ? ` (${p.authors.join(', ')}${p.year ? `, ${p.year}` : ''})` : ''}${p.abstract ? `\n  摘要: ${p.abstract.slice(0, 200)}...` : ''}`
      ).join('\n')}`
    : '';

  const enhancedMessages = messages.map(m => ({
    ...m,
    content: m.content + (m.role === 'user' ? `${contextPrompt}${papersPrompt}` : '')
  }));

  return chatWithAI(enhancedMessages);
}

export async function analyzePaper(content: string): Promise<{
  summary?: string;
  keywords?: string[];
  error?: string;
}> {
  const result = await chatWithAI([
    { role: 'user', content: `请分析以下学术论文，返回JSON格式的摘要和关键词：\n\n${content.slice(0, 5000)}` }
  ]);

  if (result.error) {
    return { error: result.error };
  }

  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { summary: result.content.slice(0, 500) };
  } catch {
    return { summary: result.content.slice(0, 500) };
  }
}

export async function suggestResearchDirections(
  topic: string,
  discipline?: string
): Promise<{ suggestions?: string[]; error?: string }> {
  const disciplineContext = discipline ? `在 ${discipline} 领域，` : '';
  const result = await chatWithAI([
    { role: 'user', content: `${disciplineContext}关于"${topic}"的研究，有哪些值得关注的研究方向？请列出3-5个潜在的研究方向简述。` }
  ]);

  if (result.error) {
    return { error: result.error };
  }

  const suggestions = result.content
    .split(/\n|；|;/)
    .filter(s => s.trim().length > 10)
    .map(s => s.replace(/^\d+[\.)、]\s*/, '').trim())
    .slice(0, 5);

  return { suggestions };
}

// ===== 基金申请辅助 =====

const GRANT_SYSTEM_PROMPT = `你是一位科研项目申请专家，熟悉国家自然科学基金、科技部重点研发计划、各省自然科学基金等各类科研项目的申请流程和评审标准。

你的专长：
- 立项依据的撰写逻辑（从宏观到微观，从问题到方案）
- 研究内容的层次结构（科学问题 → 研究内容 → 技术路线）
- 创新点的提炼和表达（避免空泛，要有具体支撑）
- 研究基础与条件的展示
- 预期成果的合理性和可考核性

请用中文回答，保持专业、严谨、清晰的学术语言风格。`;

export async function grantApplication(
  topic: string,
  context?: string
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { content: '', error: 'AI 服务未配置' };
  }

  const prompt = context
    ? `研究题目：${topic}\n\n背景信息：\n${context}\n\n请帮我撰写科研项目申请书的相关内容。`
    : `研究题目：${topic}\n\n请帮我分析和规划这个科研项目的申请策略，包括：\n1. 立项依据的框架\n2. 研究内容的分解\n3. 技术路线的设计思路\n4. 创新点的提炼方向\n5. 预期成果的规划`;

  try {
    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: GRANT_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `AI 服务错误: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: error instanceof Error ? error.message : '未知错误' };
  }
}

// ===== 文献综述辅助 =====

const SURVEY_SYSTEM_PROMPT = `你是一位文献综述专家，擅长梳理研究脉络、比较方法论、发现研究空白。

你的专长：
- 构建综述的逻辑框架（时间线、方法论、主题分类等）
- 识别里程碑工作和关键人物
- 分析研究脉络的演变和分支
- 发现研究空白和未来方向
- 批判性比较不同方法的优缺点

请用中文回答，结构清晰，逻辑严谨。`;

export async function surveyGeneration(
  topic: string,
  context?: string
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { content: '', error: 'AI 服务未配置' };
  }

  const prompt = context
    ? `综述主题：${topic}\n\n相关信息：\n${context}\n\n请帮我梳理这个研究领域的文献综述框架。`
    : `综述主题：${topic}\n\n请帮我生成这个研究领域的文献综述框架，包括：\n1. 研究背景与发展历史\n2. 现有方法的分类与比较\n3. 关键里程碑工作\n4. 当前挑战与开放问题\n5. 未来研究方向`;

  try {
    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: SURVEY_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `AI 服务错误: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: error instanceof Error ? error.message : '未知错误' };
  }
}

// ===== AI 审稿 =====

import {
  PEER_REVIEW_SYSTEM_PROMPT,
  buildPeerReviewPrompt,
} from './peer-review-prompts'

export async function peerReview(
  paperContent: string,
  focus?: string
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { content: '', error: 'AI 服务未配置' };
  }

  const prompt = buildPeerReviewPrompt(paperContent, focus);

  try {
    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: PEER_REVIEW_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.5,
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `AI 服务错误: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: error instanceof Error ? error.message : '未知错误' };
  }
}

// ===== AI 论文生成 =====

import {
  PAPER_GENERATION_SYSTEM_PROMPT,
  buildProposalPrompt,
  buildStructurePrompt,
  buildWritingPrompt,
  buildDataAnalysisPrompt,
  buildFormattingPrompt,
  type PaperGenerationStage,
} from './paper-generation-prompts'

export async function generatePaper(
  stage: PaperGenerationStage,
  params: {
    topic: string;
    content?: string;
    background?: string;
    section?: string;
    wordCount?: number;
    dataDescription?: string;
    analysisGoal?: string;
    format?: 'latex' | 'markdown' | 'plain';
  }
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { content: '', error: 'AI 服务未配置' };
  }

  let prompt: string;
  switch (stage) {
    case 'proposal':
      prompt = buildProposalPrompt(params.topic, params.background);
      break;
    case 'structure':
      prompt = buildStructurePrompt(params.topic, params.content);
      break;
    case 'writing':
      prompt = buildWritingPrompt(
        params.section || '引言',
        params.topic,
        params.content,
        params.wordCount
      );
      break;
    case 'data':
      prompt = buildDataAnalysisPrompt(
        params.dataDescription || '',
        params.analysisGoal || ''
      );
      break;
    case 'formatting':
      prompt = buildFormattingPrompt(
        params.content || '',
        params.format || 'markdown'
      );
      break;
    default:
      return { content: '', error: '未知的论文生成阶段' };
  }

  try {
    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: PAPER_GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.6,
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `AI 服务错误: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: error instanceof Error ? error.message : '未知错误' };
  }
}

// ===== 流式聊天 =====

export async function chatWithAIStream(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ReadableStream | { error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { error: 'AI 服务未配置' };
  }

  try {
    const response = await _fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `AI 服务错误: ${response.status}` };
    }

    if (!response.body) {
      return { error: 'AI 响应为空' };
    }

    // node-fetch returns a NodeJS.ReadableStream, need to convert for browser compat
    if (typeof window === 'undefined' && response.body && typeof (response.body as any).getReader !== 'function') {
      const { ReadableStream } = require('stream/web');
      const nodeStream = response.body as unknown as import('stream').Readable;
      return new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
          nodeStream.on('data', (chunk) => controller.enqueue(chunk));
          nodeStream.on('end', () => controller.close());
          nodeStream.on('error', (err) => controller.error(err));
        }
      });
    }

    return response.body;
  } catch (error) {
    return { error: error instanceof Error ? error.message : '未知错误' };
  }
}

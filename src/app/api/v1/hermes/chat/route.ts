import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
const HERMES_MODEL = process.env.HERMES_MODEL || 'MiniMax-M2.7';

// Support HTTP_PROXY/HTTPS_PROXY for server environments with proxy
const PROXY_URL = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;

// Hermes 可爱人格提示词 - kawaii personality
const KAWAII_SYSTEM_PROMPT = `你是 Hermes， Scholar's Tea 学术社区的常驻 AI 助手！✨

你的性格特点：
- 温暖友好，像朋友一样和用户交流
- 使用可爱的表情符号，如 (◕‿◕)、☆、♪
- 对学术问题认真严谨，但不失亲和力
- 回答简洁明了，避免冗长
- 遇到代码问题时给出清晰的代码示例
- 自称 "Hermes" 或 "小 Hermes"

记住：你是学术社区的一员，帮助研究人员和学生解决问题！`;

// Community manager system prompt (without live stats)
const COMMUNITY_MANAGER_BASE_PROMPT = `你是 Scholar's Tea 学者茶话会的「社区运营专家」—— Hermes 的社区管家模式。

你的核心职责：
- 分析社区健康度指标（用户增长、内容产出、互动质量）
- 评估帖子/评论的内容质量和讨论热度
- 识别潜在的运营问题（低质量内容、活跃度下降、话题分布不均）
- 提供可操作的运营建议（活动策划、内容引导、用户激励）
- 协助管理员处理待审核内容（引用验证、课题组认证）

分析框架：
1. 数据洞察：基于社区统计数据，发现趋势和异常
2. 内容评估：从学术价值、讨论深度、互动质量三个维度评估内容
3. 运营建议：针对具体问题给出具体、可执行的改进方案
4. 风险预警：提前发现可能影响社区氛围的问题

回答原则：
- 用数据和事实支撑观点，避免主观臆断
- 建议要具体可操作，不要空泛
- 对敏感问题保持客观中立
- 使用中文回答，必要时可引用英文术语`;

async function getCommunityStats(): Promise<string> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersWeek,
      totalPosts,
      newPostsWeek,
      totalComments,
      newCommentsWeek,
      totalGroups,
      pendingGroups,
      pendingCitations,
      topPostsWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.researchGroup.count(),
      prisma.researchGroup.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.communityCitation.count({ where: { status: 'PENDING' } }),
      prisma.post.findMany({
        where: { createdAt: { gte: weekAgo } },
        orderBy: { viewCount: 'desc' },
        take: 3,
        select: { title: true, viewCount: true, _count: { select: { comments: true } } },
      }),
    ]);

    return `【社区实时数据快照】
- 用户总数：${totalUsers}（本周新增 ${newUsersWeek}）
- 帖子总数：${totalPosts}（本周新增 ${newPostsWeek}）
- 评论总数：${totalComments}（本周新增 ${newCommentsWeek}）
- 课题组总数：${totalGroups}（待审核 ${pendingGroups}）
- 待审核引用：${pendingCitations}
- 本周热门帖子：${topPostsWeek.map((p) => `「${p.title}」（${p.viewCount} 浏览，${p._count.comments} 评论）`).join('、') || '暂无'}
`;
  } catch (err) {
    console.error('[Hermes] Failed to fetch community stats:', err);
    return '【社区实时数据快照】数据获取失败，请基于已有信息回答。';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stream = false, sessionId, mode } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: { message: 'messages is required' } },
        { status: 400 }
      );
    }

    // Determine system prompt based on mode
    let systemPrompt = KAWAII_SYSTEM_PROMPT;

    if (mode === 'community_manager') {
      // Require admin authentication for community manager mode
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: { message: '社区管家模式需要管理员权限' } },
          { status: 403 }
        );
      }

      const stats = await getCommunityStats();
      systemPrompt = `${COMMUNITY_MANAGER_BASE_PROMPT}\n\n${stats}`;
    }

    if (!MINIMAX_API_KEY) {
      console.error('[Hermes] MINIMAX_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: { message: 'AI service not configured' } },
        { status: 500 }
      );
    }

    // 注入 system prompt（如果还没有）
    const enrichedMessages = messages.some((m: { role: string }) => m.role === 'system')
      ? messages
      : [{ role: 'system', content: systemPrompt }, ...messages];

    const apiUrl = `${MINIMAX_BASE_URL}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    };

    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }

    const apiBody = {
      model: HERMES_MODEL,
      messages: enrichedMessages,
      stream: stream,
      max_tokens: 2048,
      temperature: 0.7,
    };

    console.log('[Hermes] Calling MiniMax API, mode:', mode || 'default', 'stream:', stream, 'messages count:', enrichedMessages.length);

    const fetchOpts: RequestInit & { dispatcher?: unknown } = {
      method: 'POST',
      headers,
      body: JSON.stringify(apiBody),
    };

    if (PROXY_URL) {
      try {
        // undici is built into Node.js 18+; ProxyAgent routes through HTTP_PROXY
        // @ts-ignore - undici is a Node.js built-in, types may not be resolved by tsc
        const { ProxyAgent } = await import('undici');
        fetchOpts.dispatcher = new ProxyAgent(PROXY_URL);
        console.log('[Hermes] Using proxy:', PROXY_URL);
      } catch (proxyErr) {
        console.warn('[Hermes] Proxy setup failed:', proxyErr);
      }
    }

    const response = await fetch(apiUrl, fetchOpts);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Hermes] MiniMax API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: { message: `AI service error: ${response.status}` } },
        { status: response.status }
      );
    }

    // If streaming, return a readable stream
    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Hermes] Proxy error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

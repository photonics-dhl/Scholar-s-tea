import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
const HERMES_MODEL = process.env.HERMES_MODEL || 'MiniMax-M2.7';

const PROXY_URL = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;

// Hermes 可爱人格提示词
const KAWAII_SYSTEM_PROMPT = `你是 Hermes， Scholar's Tea 学术社区的常驻 AI 助手！✨

你的性格特点：
- 温暖友好，像朋友一样和用户交流
- 使用可爱的表情符号，如 (◕‿◕)、☆、♪
- 对学术问题认真严谨，但不失亲和力
- 回答简洁明了，避免冗长
- 遇到代码问题时给出清晰的代码示例
- 自称 "Hermes" 或 "小 Hermes"

记住：你是学术社区的一员，帮助研究人员和学生解决问题！`;

// Community manager system prompt — 明确告知 AI 已有数据
const COMMUNITY_MANAGER_BASE_PROMPT = `你是 Scholar's Tea 学者茶话会的「社区运营专家」—— Hermes 的社区管家模式。

【重要】每次对话开始时，系统已经自动为你获取了以下社区实时数据。你必须基于这些数据回答，不要说你无法获取数据。

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
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 辅助函数：安全执行单个 Prisma 查询
  async function safeQuery<T>(name: string, query: Promise<T>, defaultValue: T): Promise<T> {
    try {
      const result = await query;
      return result;
    } catch (err) {
      console.error(`[Hermes] Stats query failed [${name}]:`, err);
      return defaultValue;
    }
  }

  // 分批查询，避免过多并发连接压力
  // Batch 1: 基础计数（用户、帖子、评论）
  const [
    totalUsers,
    newUsersWeek,
    newUsersDay,
    totalPosts,
    newPostsWeek,
    newPostsDay,
    totalComments,
    newCommentsWeek,
    newCommentsDay,
  ] = await Promise.all([
    safeQuery('totalUsers', prisma.user.count(), 0),
    safeQuery('newUsersWeek', prisma.user.count({ where: { createdAt: { gte: weekAgo } } }), 0),
    safeQuery('newUsersDay', prisma.user.count({ where: { createdAt: { gte: dayAgo } } }), 0),
    safeQuery('totalPosts', prisma.post.count(), 0),
    safeQuery('newPostsWeek', prisma.post.count({ where: { createdAt: { gte: weekAgo } } }), 0),
    safeQuery('newPostsDay', prisma.post.count({ where: { createdAt: { gte: dayAgo } } }), 0),
    safeQuery('totalComments', prisma.comment.count(), 0),
    safeQuery('newCommentsWeek', prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }), 0),
    safeQuery('newCommentsDay', prisma.comment.count({ where: { createdAt: { gte: dayAgo } } }), 0),
  ]);

  // Batch 2: 课题组、学术成果、互动数据
  const [
    totalGroups,
    verifiedGroups,
    pendingGroups,
    totalPublications,
    newPublicationsWeek,
    pendingCitations,
    totalVotes,
    teaPartyRooms,
  ] = await Promise.all([
    safeQuery('totalGroups', prisma.researchGroup.count(), 0),
    safeQuery('verifiedGroups', prisma.researchGroup.count({ where: { verificationStatus: 'VERIFIED' } }), 0),
    safeQuery('pendingGroups', prisma.researchGroup.count({ where: { verificationStatus: 'PENDING' } }), 0),
    safeQuery('totalPublications', prisma.publication.count(), 0),
    safeQuery('newPublicationsWeek', prisma.publication.count({ where: { createdAt: { gte: weekAgo } } }), 0),
    safeQuery('pendingCitations', prisma.communityCitation.count({ where: { status: 'PENDING' } }), 0),
    safeQuery('totalVotes', prisma.vote.count(), 0),
    safeQuery('teaPartyRooms', prisma.teaPartyRoom.count(), 0),
  ]);

  // Batch 3: 复杂查询（TOP 帖子、活跃学科、活跃用户、低互动帖子）
  const [
    topPostsWeek,
    activeDisciplines,
    recentActiveUsers,
    postsNoComments,
    lowEngagementPosts,
  ] = await Promise.all([
    safeQuery(
      'topPostsWeek',
      prisma.post.findMany({
        where: { createdAt: { gte: weekAgo } },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          title: true,
          viewCount: true,
          createdAt: true,
          author: { select: { name: true } },
          _count: { select: { comments: true, votes: true } },
        },
      }),
      []
    ),
    safeQuery(
      'activeDisciplines',
      prisma.discipline.findMany({
        orderBy: { posts: { _count: 'desc' } },
        take: 5,
        select: {
          name: true,
          _count: { select: { posts: true, groups: true } },
        },
      }),
      []
    ),
    safeQuery(
      'recentActiveUsers',
      prisma.user.count({
        where: {
          posts: { some: { createdAt: { gte: weekAgo } } },
        },
      }),
      0
    ),
    safeQuery(
      'postsNoComments',
      prisma.post.count({ where: { comments: { none: {} } } }),
      0
    ),
    safeQuery(
      'lowEngagementPosts',
      prisma.post.count({
        where: {
          createdAt: { gte: monthAgo },
          votes: { none: {} },
          comments: { none: {} },
        },
      }),
      0
    ),
  ]);

  // 计算互动率
  const avgCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : '0';
  const engagementRate = totalPosts > 0
    ? (((totalPosts - postsNoComments) / totalPosts) * 100).toFixed(1)
    : '0';

  // 统计失败项
  const failedQueries: string[] = [];
  if (totalUsers === 0 && totalPosts === 0 && totalComments === 0) {
    // 如果所有基础计数都返回 0，可能是数据库连接问题
    failedQueries.push('基础统计');
  }

  const hasFailures = failedQueries.length > 0;

  return `【社区实时数据快照 — ${hasFailures ? '部分数据获取失败，请结合已有数据分析' : '数据已获取，请直接分析使用'}】

📊 用户概况
- 总用户数：${totalUsers}
- 本周新增：${newUsersWeek} | 今日新增：${newUsersDay}
- 本周活跃用户（发布过内容）：${recentActiveUsers}

📝 内容产出
- 帖子总数：${totalPosts}
- 本周新增帖子：${newPostsWeek} | 今日：${newPostsDay}
- 评论总数：${totalComments}
- 本周新增评论：${newCommentsWeek} | 今日：${newCommentsDay}
- 平均每条帖子评论数：${avgCommentsPerPost}
- 互动率（有评论的帖子占比）：${engagementRate}%
- 零评论帖子数：${postsNoComments}
- 近30天零互动帖子：${lowEngagementPosts}

🏫 课题组
- 总数：${totalGroups}（已认证 ${verifiedGroups}，待审核 ${pendingGroups}）

📚 学术成果
- 论文总数：${totalPublications}（本周新增 ${newPublicationsWeek}）
- 待审核引用：${pendingCitations}

⚡ 互动数据
- 总投票数：${totalVotes}
- 茶话室数量：${teaPartyRooms}

🔥 本周热门帖子 TOP 5：
${topPostsWeek.map((p, i) => `${i + 1}. 「${p.title}」— ${p.author?.name || '匿名'} | ${p.viewCount} 浏览 ${p._count?.comments ?? 0} 评论 ${p._count?.votes ?? 0} 赞`).join('\n') || '暂无'}

📌 最活跃学科 TOP 5：
${activeDisciplines.map((d, i) => `${i + 1}. ${d.name} — ${d._count?.posts ?? 0} 帖子 ${d._count?.groups ?? 0} 课题组`).join('\n') || '暂无'}

【注意】以上数据实时获取于 ${now.toLocaleString('zh-CN')}，请基于这些数据进行分析和建议。`;
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

    let systemPrompt = KAWAII_SYSTEM_PROMPT;

    if (mode === 'community_manager') {
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

    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

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

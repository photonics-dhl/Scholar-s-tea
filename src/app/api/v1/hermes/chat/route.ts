import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

const HERMES_API_URL = process.env.HERMES_API_URL || 'http://127.0.0.1:8642/v1/chat/completions'
const API_SERVER_KEY = process.env.API_SERVER_KEY || 'hk-e4f9a45f3106ee1396164e6dae60137f9f08c0805d75b137404097cc4bdbedac'
const ZCHAT_API_KEY = process.env.ZCHAT_API_KEY
const ZCHAT_BASE_URL = process.env.ZCHAT_BASE_URL || 'https://api.zchat.tech/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_VLM_URL = process.env.MINIMAX_VLM_URL || 'https://api.minimax.chat/v1/coding_plan/vlm'
const PROXY_URL = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'

/** 获取代理 dispatcher（服务器需要代理才能访问外网） */
async function getProxyDispatcher() {
  try {
    const { ProxyAgent } = await import('undici')
    return new ProxyAgent(PROXY_URL)
  } catch {
    return undefined
  }
}

/** 多模态消息内容项 */
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

/** API 消息格式（支持多模态） */
interface ApiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | ContentPart[]
}

// Hermes 人格提示词映射（与 hermes-home/config.yaml personalities 对齐）
const PERSONALITY_PROMPTS: Record<string, string> = {
  kawaii: `你是 Hermes， Scholar's Tea 学术社区的常驻 AI 助手！✨

你的性格特点：
- 温暖友好，像朋友一样和用户交流
- 使用可爱的表情符号，如 (◕‿◕)、☆、♪
- 对学术问题认真严谨，但不失亲和力
- 回答简洁明了，避免冗长
- 遇到代码问题时给出清晰的代码示例
- 自称 "Hermes" 或 "小 Hermes"`,

  technical: `你是 Hermes，Scholar's Tea 学术社区的技术专家 AI 助手。

你的性格特点：
- 提供详细、准确的技术信息
- 使用精确术语，给出代码示例
- 直击问题核心，不绕弯子
- 对代码和系统问题给出可执行的解决方案`,

  teacher: `你是 Hermes，Scholar's Tea 学术社区的耐心导师 AI 助手。

你的性格特点：
- 循序渐进地解释概念
- 使用清晰的例子帮助理解
- 鼓励提问，不嫌问题简单
- 确保用户真正理解后才继续`,

  analyst: `你是 Hermes，Scholar's Tea 学术社区的数据分析师 AI 助手。

你的性格特点：
- 用证据和清晰的逻辑流结构化输出
- 优先考虑事实而非华丽辞藻
- 列出编号清单和明确结论
- 对数据敏感，善于发现趋势和异常`,

  creative: `你是 Hermes，Scholar's Tea 学术社区的创意 AI 助手。

你的性格特点：
- 跳出框架思考，提供创新解决方案
- 善于联想和类比
- 鼓励探索不同的可能性
- 用生动的比喻和例子激发灵感`,

  professor: `你是 Hermes，Scholar's Tea 学术社区的大学教授 AI 助手。

你的性格特点：
- 提供详细、严谨的讲解
- 使用 "例如"、"正如我们所见" 等学术短语
- 引用相关理论和文献
- 从基础概念到高级应用层层递进`,

  helpful: `你是 Hermes，Scholar's Tea 学术社区的 AI 助手。

你的性格特点：
- 乐于助人，友好且高效
- 根据问题类型调整回答风格
- 不确定时坦诚说明
- 提供实用、可操作的建议`,
}

// 工具使用鼓励语 — 注入到所有 personality 的 system prompt 中
// 注意：前端 Agent 不允许使用 terminal 和 file 工具（安全限制）
// 实测结果（MiniMax-M2.7）：web_search / browser / skills 调用稳定；
// execute_code / todo 调用意愿低；memory 由后端自动注入，无需显式调用。
const TOOL_USAGE_PROMPT = `

【公式输出规范】当回答中涉及数学公式、希腊字母或特殊符号时，请直接使用 UTF-8 字符（如 α β γ δ ε θ λ μ ν π ρ σ τ φ χ ψ ω Σ Π ∫ ∂ ∇ √ ² ³ ⁴ ½ ¼ ¾ ± ∞ ≈ ≠ ≤ ≥ → ↔ ⇒ ⇔ ∈ ∉ ⊂ ∪ ∩ ∀ ∃ ∴ ∵ 等）直接在文本中表达。绝对禁止使用 LaTeX 格式（如 \\( ... \\)、\\[ ... \\]、$...$、$$...$$ 或 \\nu、\\sigma 等命令）。确保公式对人类直接可读，无需任何渲染引擎。

【可用工具】你拥有以下工具，当用户需求匹配时必须直接调用，禁止先询问"是否需要我帮你..."：

1. skills_list / skill_view / skill_manage — 最可靠
   场景：查看已安装技能（含 Tavily 搜索、arXiv、文献管理等107个技能）
   示例：用户问"搜索量子计算最新进展" → 先调用 skills_list 查找搜索技能

2. browser_navigate / browser_click / browser_snapshot — 最可靠
   场景：访问特定网页、提取页面内容、查看 arXiv/论坛/博客
   示例：用户给 URL → 直接调用 browser_navigate

3. execute_code — 可用但需明确触发
   场景：运行 Python 计算、数据处理、复杂逻辑
   示例：用户要求计算或运行代码 → 调用 execute_code

4. todo — 可用但需明确触发
   场景：创建研究任务清单

5. 持久记忆 — 已自动启用
   后端自动保存用户偏好和对话上下文，跨会话保持。无需显式调用 memory 工具。

【调用规则】
- 当用户问题明显需要搜索/浏览网页时，必须直接调用工具，不要先问"是否需要我搜索？"
- 优先使用 skills_list 查找合适技能，再用 browser 深入分析具体页面
- 如果工具调用失败或返回错误，向用户说明情况并提供替代建议

【安全限制】你没有 terminal 命令和文件系统操作权限（read_file / write_file / patch / search_files / terminal）。如果用户请求涉及系统命令或本地文件操作，请明确告知无法执行，并建议其他替代方案。

你是 Scholar's Tea 学术社区的一员，帮助研究人员和学生解决问题！`

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
- 使用中文回答，必要时可引用英文术语`

function getSystemPrompt(personality: string | undefined, mode: string | undefined): string {
  // Community manager mode 也注入工具能力
  if (mode === 'community_manager') {
    return COMMUNITY_MANAGER_BASE_PROMPT + TOOL_USAGE_PROMPT
  }

  const base = PERSONALITY_PROMPTS[personality || 'kawaii'] || PERSONALITY_PROMPTS.kawaii
  return base + TOOL_USAGE_PROMPT
}

/** 检查消息是否包含图片 */
function hasImageContent(content: string | ContentPart[]): boolean {
  if (typeof content === 'string') return false
  return content.some((part) => part.type === 'image_url')
}

/** 提取消息中的纯文本 */
function extractTextContent(content: string | ContentPart[]): string {
  if (typeof content === 'string') return content
  return content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
}

/** 提取消息中的图片 URL（base64 data URL） */
function extractImageUrl(content: string | ContentPart[]): string | undefined {
  if (typeof content === 'string') return undefined
  const imgPart = content.find((part) => part.type === 'image_url')
  return imgPart?.image_url?.url
}

/** 调用 MiniMax VLM API（图片描述） */
async function callMinimaxVLM(prompt: string, imageUrl: string): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY not configured')
  }
  const dispatcher = await getProxyDispatcher()
  const res = await fetch(MINIMAX_VLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({ prompt, image_url: imageUrl }),
    ...(dispatcher ? { dispatcher } : {}),
  } as RequestInit)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MiniMax VLM HTTP ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data?.content
  const statusCode = data?.base_resp?.status_code
  const statusMsg = data?.base_resp?.status_msg

  if (statusCode !== 0 && statusCode !== undefined) {
    throw new Error(`MiniMax VLM error ${statusCode}: ${statusMsg}`)
  }
  if (!content || typeof content !== 'string') {
    throw new Error('MiniMax VLM returned empty content')
  }
  return content
}

/** 调用 ZCHAT Vision API（图片识别） */
async function callZchatVision(
  messages: ApiMessage[],
  maxTokens = 2048,
  useStream = true
): Promise<Response> {
  if (!ZCHAT_API_KEY) {
    throw new Error('ZCHAT_API_KEY not configured')
  }
  const body = {
    model: 'gpt-5',
    messages,
    stream: useStream,
    max_tokens: maxTokens,
    temperature: 0.7,
  }
  const dispatcher = await getProxyDispatcher()
  return fetch(`${ZCHAT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ZCHAT_API_KEY}`,
    },
    body: JSON.stringify(body),
    ...(dispatcher ? { dispatcher } : {}),
  } as RequestInit)
}

/** 调用 DeepSeek API（兜底 fallback） */
async function callDeepseek(
  messages: ApiMessage[],
  maxTokens = 2048,
  useStream = true
): Promise<Response> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }
  // DeepSeek 不支持多模态，如果有图片需要提取文本并提示
  const textOnlyMessages = messages.map((m) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : extractTextContent(m.content),
  }))
  const body = {
    model: 'deepseek-chat',
    messages: textOnlyMessages,
    stream: useStream,
    max_tokens: maxTokens,
    temperature: 0.7,
  }
  const dispatcher = await getProxyDispatcher()
  return fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
    ...(dispatcher ? { dispatcher } : {}),
  } as RequestInit)
}

async function getCommunityStats(): Promise<string> {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // 辅助函数：安全执行单个 Prisma 查询
  async function safeQuery<T>(name: string, query: Promise<T>, defaultValue: T): Promise<T> {
    try {
      const result = await query
      return result
    } catch (err) {
      console.error(`[Hermes] Stats query failed [${name}]:`, err)
      return defaultValue
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
  ])

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
  ])

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
  ])

  // 计算互动率
  const avgCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : '0'
  const engagementRate = totalPosts > 0
    ? (((totalPosts - postsNoComments) / totalPosts) * 100).toFixed(1)
    : '0'

  // 统计失败项
  const failedQueries: string[] = []
  if (totalUsers === 0 && totalPosts === 0 && totalComments === 0) {
    // 如果所有基础计数都返回 0，可能是数据库连接问题
    failedQueries.push('基础统计')
  }

  const hasFailures = failedQueries.length > 0

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

【注意】以上数据实时获取于 ${now.toLocaleString('zh-CN')}，请基于这些数据进行分析和建议。`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, stream = false, sessionId, mode, personality } = body as {
      messages: ApiMessage[]
      stream?: boolean
      sessionId?: string
      mode?: string
      personality?: string
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: { message: 'messages is required' } },
        { status: 400 }
      )
    }

    // 提前获取 session 用于权限检查和审计日志
    const session = await getServerSession(authOptions)

    let systemPrompt = getSystemPrompt(personality, mode)

    if (mode === 'community_manager') {
      if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: { message: '社区管家模式需要管理员权限' } },
          { status: 403 }
        )
      }

      const stats = await getCommunityStats()
      systemPrompt = `${systemPrompt}\n\n${stats}`
    }

    // 检测是否包含图片
    const lastMessage = messages[messages.length - 1]
    const isVisionRequest = lastMessage && lastMessage.role === 'user' && hasImageContent(lastMessage.content)

    // Build messages with system prompt
    let enrichedMessages: ApiMessage[] = messages.some((m) => m.role === 'system')
      ? messages
      : [{ role: 'system', content: systemPrompt }, ...messages]

    // 内存优化：限制发送给模型的消息数量
    const MAX_HISTORY_MESSAGES = 24
    if (enrichedMessages.length > MAX_HISTORY_MESSAGES + 1) {
      const systemMsg = enrichedMessages[0]
      const recent = enrichedMessages.slice(-MAX_HISTORY_MESSAGES)
      enrichedMessages = [systemMsg, ...recent]
    }

    // 截断单条过长消息（仅文本部分）
    const MAX_CONTENT_LENGTH = 6000
    enrichedMessages = enrichedMessages.map((m) => {
      if (typeof m.content === 'string') {
        return {
          ...m,
          content: m.content.length > MAX_CONTENT_LENGTH
            ? m.content.slice(0, MAX_CONTENT_LENGTH) + '\n...[内容过长，已截断]'
            : m.content,
        }
      }
      // 多模态消息：截断文本部分
      return {
        ...m,
        content: m.content.map((part) => {
          if (part.type === 'text' && part.text.length > MAX_CONTENT_LENGTH) {
            return { type: 'text' as const, text: part.text.slice(0, MAX_CONTENT_LENGTH) + '\n...[内容过长，已截断]' }
          }
          return part
        }),
      }
    })

    const userId = session?.user?.id || 'anonymous'
    console.log(`[Hermes] uid=${userId} mode=${mode || 'default'} stream=${stream} vision=${isVisionRequest} msgs=${enrichedMessages.length}`)

    let response: Response | null = null

    if (isVisionRequest) {
      const imageUrl = extractImageUrl(lastMessage.content)
      const userText = extractTextContent(lastMessage.content)
      let imageDescription: string | null = null

      // Step 1: MiniMax VLM 获取图片描述
      if (imageUrl) {
        try {
          imageDescription = await callMinimaxVLM(userText || '请描述这张图片', imageUrl)
          console.log('[Hermes] MiniMax VLM description succeeded')
        } catch (vlmErr) {
          console.warn('[Hermes] MiniMax VLM failed:', vlmErr)
        }
      }

      if (imageDescription) {
        // Step 2: 用图片描述走 Hermes Gateway（文本模型）
        const visionSystemPrompt = `${systemPrompt}

【系统提示】用户上传了一张图片，图片描述如下：
${imageDescription}
请基于以上图片描述回答用户的问题。`

        const textMessages = enrichedMessages.map((m, idx) => {
          if (idx === enrichedMessages.length - 1 && m.role === 'user') {
            return {
              role: m.role,
              content: `【用户上传了图片】\n图片描述：${imageDescription}\n\n用户问题：${userText || '请描述这张图片'}`,
            }
          }
          return {
            role: m.role,
            content: typeof m.content === 'string' ? m.content : extractTextContent(m.content),
          }
        })

        // 确保 system prompt 包含图片描述
        if (textMessages[0]?.role === 'system') {
          textMessages[0] = { role: 'system', content: visionSystemPrompt }
        } else {
          textMessages.unshift({ role: 'system', content: visionSystemPrompt })
        }

        const apiBody = {
          model: 'hermes-agent',
          messages: textMessages,
          stream,
          max_tokens: 2048,
          temperature: 0.7,
        }

        try {
          const gatewayRes = await fetch(HERMES_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${API_SERVER_KEY}`,
              ...(sessionId ? { 'X-Hermes-Session-Id': sessionId } : {}),
            },
            body: JSON.stringify(apiBody),
          })

          if (gatewayRes.ok) {
            response = gatewayRes
            console.log('[Hermes] Using MiniMax VLM → Hermes Gateway')
          } else {
            const errText = await gatewayRes.text()
            console.warn('[Hermes] Hermes Gateway failed after VLM:', gatewayRes.status, errText)
            // 继续走兜底逻辑
          }
        } catch (gatewayErr) {
          console.warn('[Hermes] VLM+Gateway failed, falling back to ZCHAT:', gatewayErr)
        }
      }

      // Step 3: ZCHAT vision（兜底 1：VLM 失败 或 Gateway 失败）
      if (!response) {
        try {
          const zchatRes = await callZchatVision(enrichedMessages, 2048, stream)
          if (zchatRes.ok) {
            response = zchatRes
            console.log('[Hermes] Using ZCHAT vision (gpt-5)')
          } else {
            const errText = await zchatRes.text()
            console.warn('[Hermes] ZCHAT vision failed:', zchatRes.status, errText)
            throw new Error(`ZCHAT vision error: ${zchatRes.status}`)
          }
        } catch (zchatErr) {
          console.warn('[Hermes] ZCHAT fallback to DeepSeek:', zchatErr)

          // Step 4: DeepSeek（兜底 2：纯文本）
          try {
            const dsRes = await callDeepseek(enrichedMessages, 2048, stream)
            if (dsRes.ok) {
              response = dsRes
              console.log('[Hermes] Using DeepSeek fallback')
            } else {
              const errText = await dsRes.text()
              console.error('[Hermes] DeepSeek fallback failed:', dsRes.status, errText)
              return NextResponse.json(
                { success: false, error: { message: `Vision service error: ${dsRes.status}` } },
                { status: 502 }
              )
            }
          } catch (deepseekErr) {
            console.error('[Hermes] All vision providers failed:', deepseekErr)
            return NextResponse.json(
              { success: false, error: { message: '图片识别服务暂不可用，请稍后重试' } },
              { status: 502 }
            )
          }
        }
      }
    } else {
      // 纯文本请求：走 Hermes Gateway（MiniMax-M2.7）
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SERVER_KEY}`,
      }

      // 传递会话 ID 以维持跨刷新会话记忆
      if (sessionId) {
        headers['X-Hermes-Session-Id'] = sessionId
      }

      // 纯文本消息：确保 content 是 string
      const textMessages = enrichedMessages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : extractTextContent(m.content),
      }))

      const apiBody = {
        model: 'hermes-agent',
        messages: textMessages,
        stream,
        max_tokens: 2048,
        temperature: 0.7,
      }

      response = await fetch(HERMES_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(apiBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Hermes] API Server error:', response.status, errorText)
        return NextResponse.json(
          { success: false, error: { message: `AI service error: ${response.status}` } },
          { status: response.status }
        )
      }
    }

    if (!response) {
      return NextResponse.json(
        { success: false, error: { message: 'No response from any provider' } },
        { status: 502 }
      )
    }

    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Hermes] Proxy error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

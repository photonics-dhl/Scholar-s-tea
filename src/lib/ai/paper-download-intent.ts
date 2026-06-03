/**
 * 论文下载意图检测 — Workshop + FloatingChat 统一使用
 *
 * 检测用户消息是否包含下载/搜索学术论文的意图。
 * 覆盖场景：
 * - 显式请求："帮我下载论文"、"下载这篇文献"
 * - 作者+期刊："浙大童利民老师03年的nature文章"
 * - DOI/arXiv："DOI: 10.1038/..."、"arXiv: 2305.11148"
 * - 工具名："scansci-pdf"、"sci-pdf"
 * - 搜索+下载："找一下这篇论文并下载"
 * - 批量："批量下载这些DOI"
 */

const DOWNLOAD_KEYWORDS = [
  '下载',
  '帮我下',
  '给我下',
  '获取',
  '保存',
  '抓',
  '扒',
  'down',
  'fetch',
  'save',
  'get',
]

const PAPER_KEYWORDS = [
  '论文',
  '文献',
  '文章',
  'paper',
  'article',
  'publication',
  'manuscript',
  'pdf',
  'PDF',
]

const ACADEMIC_JOURNALS = [
  'nature',
  'science',
  'cell',
  'pnas',
  'arxiv',
  'arxiv',
  'ieee',
  'acs',
  'aps',
  'rsc',
  'wiley',
  'elsevier',
  'springer',
  'mdpi',
  'frontiers',
]

const SEARCH_KEYWORDS = [
  '找',
  '搜',
  '查',
  '查找',
  '搜索',
  '查询',
  'look for',
  'search',
  'find',
]

const TOOL_KEYWORDS = [
  'scansci',
  'sci-pdf',
  'scihub',
  'sci-hub',
  'unpaywall',
  'crossref',
  'openalex',
]

/** 提取纯文本（支持多模态消息） */
export function extractText(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === 'string') return content
  return content
    .filter((c) => c.type === 'text')
    .map((c) => ('text' in c ? c.text : ''))
    .filter(Boolean)
    .join('\n')
}

/** 检测是否为论文下载意图 */
export function isPaperDownloadIntent(content: string): boolean {
  const text = content.toLowerCase()

  // 1. 直接工具名提及 — 最高置信度
  for (const kw of TOOL_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return true
  }

  // 2. DOI / arXiv ID 格式 — 高置信度
  if (/\b(?:doi|DOI)\s*[:：]\s*10\.\d{4,}\//.test(content)) return true
  if (/\b(?:arxiv|arXiv)\s*[:：]?\s*\d{4}\.\d{4,5}/.test(content)) return true
  if (/\b(?:pmid|PMID)\s*[:：]?\s*\d{5,}/.test(content)) return true

  // 3. 下载 + 学术期刊名 — 高置信度（如"下载nature文章"）
  const hasDownload = DOWNLOAD_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
  const hasJournal = ACADEMIC_JOURNALS.some((kw) => text.includes(kw.toLowerCase()))
  if (hasDownload && hasJournal) return true

  // 4. 下载/获取 + 论文相关词（不限距离）— 中等置信度
  const hasPaperKw = PAPER_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
  if (hasDownload && hasPaperKw) return true

  // 5. 搜索 + 下载 组合 — 中等置信度
  const hasSearch = SEARCH_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
  if (hasSearch && hasDownload) return true

  // 6. "批量下载" — 明确意图
  if (/批量\s*(?:下载|获取|抓取)/i.test(content)) return true

  // 7. 经典正则兜底（兼容旧逻辑）
  const legacyPatterns = [
    /下载\s*(?:论文|文献|PDF|pdf)/i,
    /(?:帮我|请|能).{0,10}下载\s*(?:论文|文献|PDF)/i,
    /(?:找|搜索).{0,5}(?:论文|文献).{0,10}下载/i,
    /(?:下载|获取)\s*(?:这篇|该篇|此篇)?.{0,10}(?:论文|文献|文章)/i,
  ]
  if (legacyPatterns.some((p) => p.test(content))) return true

  return false
}

/**
 * 检测后追加的系统提示 — 强化 AI 调用 scansci-pdf 的意愿
 *
 * 批量模式（batchMode=true）：两步流程 — 先搜索返回候选列表，等用户确认后再下载
 * 单篇模式（batchMode=false 或未指定）：直接搜索验证后下载
 */
export function getDownloadTriggerHint(
  userContent: string,
  options?: { batchMode?: boolean; strategy?: string; platform?: 'web' | 'feishu' | 'unknown' }
): string {
  const platform = options?.platform || 'unknown'
  const doiMatch = userContent.match(/\b(?:doi|DOI)\s*[:：]\s*(10\.\d{4,}\/[^\s\]]+)/)
  const arxivMatch = userContent.match(/\b(?:arxiv|arXiv)\s*[:：]?\s*(\d{4}\.\d{4,5})/)

  // 平台上下文约束
  const platformConstraint = platform === 'web'
    ? '\n【平台上下文】当前用户通过 Web 浏览器访问 Scholar\'s Tea 平台。下载完成后**只返回** `[ATTACHMENT:文件名.pdf]` 标记即可，**严禁在正文中写出服务器本地文件路径**（如 /data/home/zju321/... 或 ~/.hermes/...）。绝对禁止调用 send_message 工具、execute_code 工具运行 send_pdf_feishu.py、或在回复中包含 MEDIA: 指令发送到飞书/其他平台。'
    : platform === 'feishu'
    ? '\n【平台上下文】当前用户通过飞书访问。如用户明确要求发送到群里，可使用 send_message 工具或 MEDIA: 指令发送文件到飞书。'
    : ''

  // 批量下载模式：两步流程
  if (options?.batchMode) {
    let hint = '\n\n【系统指令 - 批量下载模式】用户请求批量下载学术论文。'

    hint += ' 你必须严格执行以下两步流程：'
    hint += '\n步骤1（搜索展示）：使用 mcp_semantic_scholar_search_papers 或 mcp_paper_search_search_research 搜索文献，按引用数降序排列，取前10篇（或用户指定数量）。'
    hint += ' 将搜索结果以以下 JSON 数组格式返回，包裹在 [PAPER_CANDIDATES] 和 [/PAPER_CANDIDATES] 标记中（必须严格使用此标记，以便前端解析）：'
    hint += '\n[PAPER_CANDIDATES]'
    hint += '\n[{"id":"1","title":"论文标题","authors":["作者1","作者2"],"year":2024,"venue":"期刊名","citations":150,"doi":"10.xxxx/xxxxx","abstract":"摘要..."},...]'
    hint += '\n[/PAPER_CANDIDATES]'
    hint += '\n步骤2（等待确认）：不要立即调用下载工具。等待用户从前端界面勾选并确认要下载的文献。'
    hint += '\n当用户确认后，你会收到一条包含选中 DOI 列表的新消息，此时再调用 mcp_scansci_pdf_smart_download 批量下载。'
    hint += '\n每下载完成一篇，仅在回复末尾添加 `[ATTACHMENT:文件名.pdf]` 标记，不要在正文中写出服务器本地文件路径。'
    hint += platformConstraint
    hint += '\n绝对禁止基于模型记忆直接回答论文信息，必须先搜索验证。'

    if (options.strategy && options.strategy !== 'fastest') {
      const strategyHint: Record<string, string> = {
        oa_first: '优先使用 Unpaywall、OpenAlex 等开放获取渠道',
        scihub_only: '仅使用 Sci-Hub 渠道',
        legal_only: '仅使用合法开放获取渠道（Unpaywall、机构库等），禁止使用 Sci-Hub',
      }
      hint += `\n【下载策略】${strategyHint[options.strategy] || ''}`
    }

    return hint
  }

  // 单篇下载模式（原有逻辑）
  let hint = '\n\n【系统指令】用户明确表示需要下载学术论文。'

  if (doiMatch) {
    hint += ` 检测到 DOI: ${doiMatch[1]}。请先调用 mcp_semantic_scholar_search_papers 或 mcp_paper_search_search_research 验证该 DOI 对应的论文标题和作者信息，确认无误后再调用 mcp_scansci_pdf_smart_download 工具下载该论文。`
  } else if (arxivMatch) {
    hint += ` 检测到 arXiv ID: ${arxivMatch[1]}。请先调用 mcp_semantic_scholar_search_papers 验证该 ID 对应的论文信息，确认无误后再调用 mcp_scansci_pdf_smart_download 工具下载该论文。`
  } else {
    hint += ' 请调用 mcp_semantic_scholar_search_papers 或 mcp_paper_search_search_research 搜索论文并确认准确 DOI，然后调用 mcp_scansci_pdf_smart_download 下载。'
  }

  hint += ' 下载完成后仅在回复末尾添加 `[ATTACHMENT:文件名.pdf]` 标记，不要在正文中写出服务器本地文件路径。'
  hint += platformConstraint
  hint += ' 禁止先询问用户"是否需要我帮你下载"。绝对禁止基于模型记忆直接回答论文信息，必须先搜索验证。'

  return hint
}

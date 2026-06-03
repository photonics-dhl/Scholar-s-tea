/**
 * URL 内容提取与结构化摘要生成服务
 *
 * 知识库定位：社区精选知识卡片库
 * - 不存全文，只存 AI 生成的结构化摘要 + 社区笔记
 * - 原文通过 metadata.url 外链
 */

import { chatWithZAI } from './zai-service'
import {
  KNOWLEDGE_DISCIPLINES,
  ALL_KNOWLEDGE_TAGS,
  normalizeDiscipline,
} from '@/lib/knowledge/categories'

export interface ParsedUrlResult {
  title: string
  content: string
  metadata: {
    url: string
    authors?: string
    year?: string
    discipline?: string
    tags?: string[]
  }
  source: string
}

interface JinaResponse {
  title?: string
  content?: string
  error?: string
}

// 构建学科选项字符串
const DISCIPLINE_OPTIONS = KNOWLEDGE_DISCIPLINES.map(
  (d) => `${d.label}(${d.value})`
).join(', ')

const TAG_OPTIONS = ALL_KNOWLEDGE_TAGS.slice(0, 30).join(', ')

const SUMMARY_SYSTEM_PROMPT = `你是 Scholar's Tea 学术知识库的摘要生成助手。
请基于提供的网页或文献内容，生成一份**结构化知识卡片摘要**，用于学术社区的知识沉淀。

要求：
1. 提取标题、作者（如有）、年份（如有）
2. 生成四段式结构化摘要，每段 80-150 字：
   - 【核心贡献】这篇工作解决了什么问题，有什么创新点
   - 【方法亮点】用了什么关键方法、技术或实验设计
   - 【关键结论】主要结果、数据或发现是什么
   - 【局限与启发】不足之处是什么，对读者/研究者有什么启发
3. 推断该内容最匹配的【学科】和【标签】
4. 语言简洁专业，避免泛泛而谈
5. 如果内容不是学术文献（如博客、教程、新闻），则按"核心观点/方法/结论/启发"四段组织

【可选学科】（单选，选最匹配的一个）：
${DISCIPLINE_OPTIONS}

【可选标签】（多选，选 2-5 个最相关的）：
${TAG_OPTIONS}

输出格式（严格按此格式）：
标题：[提取的标题]
作者：[作者，如无法识别则写"未知"]
年份：[年份，如无法识别则写"未知"]
学科：[学科 value，如无法推断则写"unknown"]
标签：[标签1, 标签2, ...，如无法推断则写"unknown"]

【核心贡献】
...

【方法亮点】
...

【关键结论】
...

【局限与启发】
...`

/**
 * 通过 Jina AI Reader 抓取 URL 内容
 * https://r.jina.ai/<url> — 免费，无需 API key
 */
async function fetchViaJina(url: string): Promise<JinaResponse> {
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`
    const response = await fetch(jinaUrl, {
      headers: {
        Accept: 'text/plain',
      },
    })

    if (!response.ok) {
      return { error: `Jina Reader 抓取失败: ${response.status}` }
    }

    const text = await response.text()
    if (!text || text.trim().length === 0) {
      return { error: 'Jina Reader 返回空内容' }
    }

    // Jina Reader 返回格式：第一行通常是标题（可能带 # 前缀）
    const lines = text.trim().split('\n')
    let title = ''
    let contentStartIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.length > 0) {
        // 去掉可能的 # 前缀
        title = line.replace(/^#+\s*/, '').trim()
        contentStartIndex = i + 1
        break
      }
    }

    const content = lines.slice(contentStartIndex).join('\n').trim()

    return {
      title: title || '未知标题',
      content: content || text.trim(),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Jina Reader 请求失败',
    }
  }
}

/**
 * 内容质量过滤
 * 拒绝过短内容、错误页面、登录页等
 */
export function validateContentQuality(text: string): { valid: boolean; reason?: string } {
  const trimmed = text.trim()

  if (trimmed.length < 200) {
    return { valid: false, reason: '内容过短（< 200 字符），可能不是有效学术内容' }
  }

  if (trimmed.length > 100_000) {
    return { valid: false, reason: '内容过长（> 10 万字符）' }
  }

  // 错误页面检测
  const errorPatterns = [
    '404 not found',
    '403 forbidden',
    'access denied',
    'please sign in',
    'please log in',
    'captcha',
    'robot check',
    'page not found',
    '登录',
    '请登录',
    '验证',
  ]
  const lower = trimmed.toLowerCase()
  for (const pattern of errorPatterns) {
    if (lower.includes(pattern) && trimmed.length < 1500) {
      return { valid: false, reason: `疑似错误/拦截页面：${pattern}` }
    }
  }

  return { valid: true }
}

/**
 * 调用 ZAI 生成结构化摘要 + 自动分类
 */
async function generateStructuredSummary(rawContent: string): Promise<{
  title: string
  authors: string
  year: string
  discipline: string | null
  tags: string[]
  summary: string
  error?: string
}> {
  const { content, error } = await chatWithZAI(
    [
      {
        role: 'user',
        content: `请分析以下内容并生成结构化知识卡片摘要：\n\n---\n${rawContent.slice(0, 8000)}\n---`,
      },
    ],
    {
      systemPrompt: SUMMARY_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 2048,
    }
  )

  if (error || !content) {
    return {
      title: '',
      authors: '',
      year: '',
      discipline: null,
      tags: [],
      summary: '',
      error: error || 'AI 摘要生成失败',
    }
  }

  // 解析输出
  const titleMatch = content.match(/标题[：:]\s*(.+)/)
  const authorsMatch = content.match(/作者[：:]\s*(.+)/)
  const yearMatch = content.match(/年份[：:]\s*(.+)/)
  const disciplineMatch = content.match(/学科[：:]\s*(.+)/)
  const tagsMatch = content.match(/标签[：:]\s*(.+)/)

  // 提取摘要正文（四段式）
  const summaryMatch = content.match(/【核心贡献】([\s\S]*)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : content

  // 解析学科
  let discipline: string | null = null
  if (disciplineMatch) {
    const rawDiscipline = disciplineMatch[1].trim()
    discipline = normalizeDiscipline(rawDiscipline)
    // 如果标准化失败，但值不为 unknown，保留原值
    if (!discipline && rawDiscipline !== 'unknown') {
      discipline = rawDiscipline
    }
  }

  // 解析标签
  let tags: string[] = []
  if (tagsMatch) {
    const rawTags = tagsMatch[1].trim()
    if (rawTags !== 'unknown') {
      tags = rawTags
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && ALL_KNOWLEDGE_TAGS.includes(t))
        .slice(0, 5)
    }
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    authors: authorsMatch ? authorsMatch[1].trim() : '',
    year: yearMatch ? yearMatch[1].trim() : '',
    discipline,
    tags,
    summary,
  }
}

/**
 * 解析 URL，生成知识卡片预览
 * 不入库，只返回解析结果供管理员预览
 */
export async function parseUrlForKnowledgeCard(url: string): Promise<
  | ParsedUrlResult
  | { error: string }
> {
  // 1. 抓取内容
  const jinaResult = await fetchViaJina(url)
  if (jinaResult.error) {
    return { error: jinaResult.error }
  }

  // 2. 质量过滤
  const quality = validateContentQuality(jinaResult.content || '')
  if (!quality.valid) {
    return { error: quality.reason || '内容质量不符合要求' }
  }

  // 3. 生成结构化摘要 + 分类
  const summaryResult = await generateStructuredSummary(jinaResult.content || '')
  if (summaryResult.error) {
    return { error: summaryResult.error }
  }

  const title = summaryResult.title || jinaResult.title || '未知标题'
  const authors = summaryResult.authors !== '未知' ? summaryResult.authors : undefined
  const year = summaryResult.year !== '未知' ? summaryResult.year : undefined

  return {
    title,
    content: summaryResult.summary,
    metadata: {
      url,
      authors,
      year,
      discipline: summaryResult.discipline || undefined,
      tags: summaryResult.tags.length > 0 ? summaryResult.tags : undefined,
    },
    source: 'webpage',
  }
}

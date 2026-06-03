import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import {
  chatWithAI,
  chatWithContext,
  chatWithAIStream,
  analyzePaper,
  suggestResearchDirections,
  grantApplication,
  surveyGeneration,
  peerReview,
  generatePaper,
  generatePaperWithHermes,
  peerReviewWithHermes,
  grantApplicationWithHermes,
  surveyWithHermes,
  analyzePaperWithHermes,
} from '@/lib/ai/claude-service'
import type { ChatMessage, VisionContent } from '@/lib/ai/claude-service'
import { callHermesGatewayStream } from '@/lib/ai/hermes-gateway-adapter'
import { getContextForQuery, type SearchResult } from '@/lib/ai/rag-service'
import { agentModes, type AgentMode } from '@/lib/ai/agent-modes'
import { readFileSync } from 'fs'
import path from 'path'
import { guardDepth } from '@/lib/utils/loop-guard'
import { extractTextFromPdf, isPdfAttachment } from '@/lib/utils/pdf-parser'
import { processImageMarkers } from '@/lib/ai/zai-service'
import { isPaperDownloadIntent, getDownloadTriggerHint } from '@/lib/ai/paper-download-intent'

interface ChatAttachment {
  type: 'image' | 'file'
  url: string
  name: string
  size?: string
}

async function getImageBase64(imageUrl: string): Promise<string | null> {
  try {
    let pathname: string
    try {
      const url = new URL(imageUrl)
      pathname = url.pathname
    } catch {
      pathname = imageUrl
    }

    if (!pathname.startsWith('/uploads/')) {
      return null
    }

    const filename = pathname.replace('/uploads/', '')
    if (filename.includes('..') || filename.includes('/') || !filename) return null

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
    const buffer = readFileSync(filePath)
    const base64 = buffer.toString('base64')

    const ext = path.extname(filename).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    }
    const mimeType = mimeMap[ext] || 'image/png'

    return `data:${mimeType};base64,${base64}`
  } catch (err) {
    console.error('[vision] Failed to convert image:', err)
    return null
  }
}

async function buildVisionMessages(
  messages: ChatMessage[],
  attachments: ChatAttachment[] | undefined
): Promise<ChatMessage[]> {
  if (!attachments || attachments.length === 0) return messages

  const imageAttachments = attachments.filter((a) => a.type === 'image')
  if (imageAttachments.length === 0) return messages

  // Find last user message and convert to vision format
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')
  if (lastUserIndex < 0) return messages

  const content: VisionContent[] = []

  const originalContent = messages[lastUserIndex].content
  if (typeof originalContent === 'string' && originalContent.trim()) {
    content.push({ type: 'text', text: originalContent.trim() })
  }

  for (const att of imageAttachments) {
    const base64 = await getImageBase64(att.url)
    if (base64) {
      content.push({ type: 'image_url', image_url: { url: base64 } })
    }
  }

  return messages.map((m, i) => (i === lastUserIndex ? { ...m, content } : m))
}

/**
 * 注入 file 类型附件（PDF 等）的文本内容到最后一条用户消息
 */
async function injectFileAttachments(
  messages: ChatMessage[],
  attachments: ChatAttachment[] | undefined
): Promise<ChatMessage[]> {
  if (!attachments || attachments.length === 0) return messages

  const fileAttachments = attachments.filter((a) => a.type === 'file')
  if (fileAttachments.length === 0) return messages

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')
  if (lastUserIndex < 0) return messages

  let extraContent = ''

  for (const att of fileAttachments) {
    if (isPdfAttachment(att.name)) {
      // Convert URL to local file path
      let filePath = att.url
      try {
        const url = new URL(att.url)
        filePath = url.pathname
      } catch {
        // att.url might be a relative path
      }

      if (filePath.startsWith('/uploads/')) {
        const filename = filePath.replace('/uploads/', '')
        const localPath = path.join(process.cwd(), 'public', 'uploads', filename)
        const result = await extractTextFromPdf(localPath, 50000)
        if (result.error) {
          extraContent += `\n\n【附件: ${att.name}】\n[PDF 解析失败: ${result.error}]`
        } else {
          const stats = result.wasTruncated
            ? `（共 ${result.numpages} 页，${result.totalLength?.toLocaleString()} 字符，已智能提取 ${result.text.length.toLocaleString()} 字符）`
            : `（共 ${result.numpages} 页，${result.totalLength?.toLocaleString()} 字符）`
          extraContent += `\n\n【附件: ${att.name} ${stats}】\n${result.text}`
        }
      } else {
        extraContent += `\n\n【附件: ${att.name}】\n[PDF 文件路径无法解析]`
      }
    } else {
      extraContent += `\n\n【附件: ${att.name}】\n[该文件类型暂不支持自动解析，请手动粘贴内容]`
    }
  }

  if (!extraContent) return messages

  const originalContent = messages[lastUserIndex].content
  const newContent =
    typeof originalContent === 'string'
      ? originalContent + extraContent
      : extraContent

  return messages.map((m, i) =>
    i === lastUserIndex ? { ...m, content: newContent } : m
  )
}

function getSystemPrompt(mode?: AgentMode): string {
  if (mode && agentModes[mode]) {
    return agentModes[mode].systemPrompt
  }
  return agentModes.general.systemPrompt
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    const {
      messages,
      action,
      context,
      useRag,
      mode,
      stream: useStream,
      attachments,
      useHermes: useHermesOverride,
      structured: useStructured,
    } = body as {
      messages?: ChatMessage[]
      action?: 'analyze' | 'suggest' | 'grant' | 'survey' | 'peer_review' | 'paper_generation'
      context?: {
        discipline?: string
        papers?: Array<{
          title: string
          abstract?: string
          authors?: string[]
          year?: number
        }>
      }
      useRag?: boolean
      mode?: AgentMode
      stream?: boolean
      attachments?: ChatAttachment[]
      useHermes?: boolean
      structured?: boolean
    }

    // 智能路由：复杂/高质量要求任务默认走 Hermes Gateway
    // 前端可通过 useHermes 显式覆盖（true/false）
    const HERMES_ACTIONS: Array<string | undefined> = [
      'paper_generation',
      'peer_review',
      'grant',
      'survey',
      'analyze',
    ]
    const useHermes =
      useHermesOverride !== undefined
        ? useHermesOverride
        : HERMES_ACTIONS.includes(action)

    // Handle special actions
    if (action === 'analyze' && body.content) {
      let result = useHermes
        ? await analyzePaperWithHermes(body.content)
        : await analyzePaper(body.content)

      // Hermes fallback: if failed, try FastPath
      if (useHermes && result.error) {
        console.warn('[Workshop] analyze Hermes failed, fallback to FastPath:', result.error)
        result = await analyzePaper(body.content)
      }

      return NextResponse.json({
        success: true,
        data: result,
        meta: null,
      })
    }

    if (action === 'suggest' && body.topic) {
      const result = await suggestResearchDirections(
        body.topic,
        context?.discipline
      )
      return NextResponse.json({
        success: true,
        data: result,
        meta: null,
      })
    }

    if (action === 'grant') {
      const topic = body.topic || messages?.[messages.length - 1]?.content || ''

      // 流式路径：避免 frp 隧道超时断开
      if (useStream) {
        const prompt = body.context
          ? `题目：${topic}\n背景：${body.context}\n请撰写项目申请相关内容。`
          : `题目：${topic}\n请分析项目申请策略：立项依据、研究内容、技术路线、创新点、预期成果。`

        const streamResult = await chatWithAIStream(
          [{ role: 'user', content: prompt }],
          '你是科研项目申请专家，熟悉各类基金申请流程。请用中文专业回答。'
        )

        if ('error' in streamResult) {
          return NextResponse.json(
            { success: false, data: null, error: { code: 'AI_ERROR', message: streamResult.error } },
            { status: 500 }
          )
        }

        return new Response(streamResult, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }

      let result = useHermes
        ? await grantApplicationWithHermes(topic, body.context, useStructured)
        : await grantApplication(topic, body.context, useStructured)

      // Hermes fallback
      if (useHermes && result.error) {
        console.warn('[Workshop] grant Hermes failed, fallback to FastPath:', result.error)
        result = await grantApplication(topic, body.context, useStructured)
      }

      if (result.error) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: result.error } },
          { status: 500 }
        )
      }

      const responseData: Record<string, unknown> = { content: result.content }
      if (useStructured && result.structured) {
        responseData.structured = result.structured
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        meta: null,
      })
    }

    if (action === 'survey') {
      const topic = body.topic || messages?.[messages.length - 1]?.content || ''

      // 流式路径：避免 frp 隧道超时断开
      if (useStream) {
        const prompt = body.context
          ? `主题：${topic}\n背景：${body.context}\n请梳理文献综述框架。`
          : `主题：${topic}\n请生成文献综述框架：背景历史、方法比较、里程碑工作、挑战问题、未来方向。`

        const streamResult = await chatWithAIStream(
          [{ role: 'user', content: prompt }],
          '你是文献综述专家。请用中文结构化回答。'
        )

        if ('error' in streamResult) {
          return NextResponse.json(
            { success: false, data: null, error: { code: 'AI_ERROR', message: streamResult.error } },
            { status: 500 }
          )
        }

        return new Response(streamResult, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }

      let result = useHermes
        ? await surveyWithHermes(topic, body.context)
        : await surveyGeneration(topic, body.context)

      // Hermes fallback
      if (useHermes && result.error) {
        console.warn('[Workshop] survey Hermes failed, fallback to FastPath:', result.error)
        result = await surveyGeneration(topic, body.context)
      }

      if (result.error) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: result.error } },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        data: { content: result.content },
        meta: null,
      })
    }

    if (action === 'peer_review') {
      const content = body.content || messages?.[messages.length - 1]?.content || ''

      // 流式路径：避免 frp 隧道超时断开（长论文审稿可能超过60秒）
      if (useStream) {
        const reviewPrompt = `请对以下论文进行同行评审，给出评分、优点、问题和修改建议。\n\n${content.slice(0, 15000)}`
        const streamResult = await chatWithAIStream(
          [{ role: 'user', content: reviewPrompt }],
          '你是一位严格的学术论文审稿人，熟悉各学科的同行评审标准。'
        )

        if ('error' in streamResult) {
          return NextResponse.json(
            { success: false, data: null, error: { code: 'AI_ERROR', message: streamResult.error } },
            { status: 500 }
          )
        }

        return new Response(streamResult, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }

      let result = await guardDepth(
        'peer-review',
        () =>
          useHermes
            ? peerReviewWithHermes(content, body.focus, useStructured)
            : peerReview(content, body.focus, useStructured),
        2
      )

      // Hermes fallback
      if (useHermes && result.error) {
        console.warn('[Workshop] peer_review Hermes failed, fallback to FastPath:', result.error)
        result = await guardDepth(
          'peer-review',
          () => peerReview(content, body.focus, useStructured),
          2
        )
      }

      if (result.error) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: result.error } },
          { status: 500 }
        )
      }

      const responseData: Record<string, unknown> = { content: result.content }
      if (useStructured && result.structured) {
        responseData.structured = result.structured
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        meta: null,
      })
    }

    if (action === 'paper_generation') {
      // 注入 PDF 附件到 messages，确保 PDF 文本被提取并可用
      const messagesWithFiles = await injectFileAttachments(messages || [], attachments)
      const lastUserMsg = [...messagesWithFiles].reverse().find((m) => m.role === 'user')
      const injectedContent = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

      // 尝试分离用户输入和 PDF 内容（injectFileAttachments 以 '\n\n【附件:' 标记 PDF）
      const pdfMarker = '\n\n【附件:'
      const pdfIndex = injectedContent.indexOf(pdfMarker)
      const userInput = pdfIndex >= 0 ? injectedContent.slice(0, pdfIndex).trim() : injectedContent.trim()

      const topic = body.topic || userInput || injectedContent
      const content = body.content || injectedContent
      const stage = body.stage || 'proposal'


      // 提取图片附件并转为 base64（用于数据/图表阶段的视觉分析）
      let imageBase64List: string[] = []
      if (attachments && attachments.length > 0) {
        const imageAttachments = attachments.filter((a) => a.type === 'image')
        for (const att of imageAttachments) {
          const base64 = await getImageBase64(att.url)
          if (base64) imageBase64List.push(base64)
        }
        if (imageBase64List.length > 0) {
        }
      }

      let result
      if (useHermes) {
        result = await generatePaperWithHermes(stage, {
          topic,
          content,
          background: body.background,
          section: body.section,
          wordCount: body.wordCount,
          format: body.format,
          stream: useStream,
        })

        // Stream mode: return Hermes SSE stream directly
        if ('stream' in result && result.stream) {
          return new Response(result.stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          })
        }

        // Hermes fallback (non-stream only)
        if (result.error) {
          console.warn('[Workshop] paper_generation Hermes failed, fallback to FastPath:', result.error)
          result = await generatePaper(stage, {
            topic,
            content,
            background: body.background,
            section: body.section,
            wordCount: body.wordCount,
            dataDescription: body.dataDescription,
            analysisGoal: body.analysisGoal,
            format: body.format,
            enableExternalSearch: body.enableExternalSearch !== false,
            images: imageBase64List.length > 0 ? imageBase64List : undefined,
          })
        }
      } else {
        result = await generatePaper(stage, {
          topic,
          content,
          background: body.background,
          section: body.section,
          wordCount: body.wordCount,
          dataDescription: body.dataDescription,
          analysisGoal: body.analysisGoal,
          format: body.format,
          enableExternalSearch: body.enableExternalSearch !== false,
          images: imageBase64List.length > 0 ? imageBase64List : undefined,
        })
      }

      if (result.error) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: result.error } },
          { status: 500 }
        )
      }

      // 论文生成模式：解析 [GENERATE_IMAGE:...] 标记并生成配图
      let finalContent = result.content
      if (typeof finalContent === 'string' && finalContent.includes('[GENERATE_IMAGE:')) {
        const imageResult = await processImageMarkers(finalContent)
        finalContent = imageResult.text
        if (imageResult.errors.length > 0) {
          console.warn('[paper_generation] Image generation errors:', imageResult.errors)
        }
        if (imageResult.generatedCount > 0) {
        }
      }

      // 构建响应数据：内容 + 引用验证 + 检索文献
      const responseData: Record<string, unknown> = { content: finalContent }
      if ('citations' in result && result.citations) {
        responseData.citations = result.citations
      }
      if ('papers' in result && result.papers && result.papers.length > 0) {
        responseData.papers = result.papers
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        meta: null,
      })
    }

    // paper_download 模式：直接路由到 Hermes Gateway
    if (mode === 'paper_download') {
      if (!messages || messages.length === 0) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'INVALID_REQUEST', message: '消息不能为空' } },
          { status: 400 }
        )
      }

      // 注入前端下载配置
      const downloadConfig = body.downloadConfig as { batchMode?: boolean; strategy?: string } | undefined

      // 注入下载触发提示，强化 Gateway 调用 scansci-pdf 的意愿
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
      const lastUserText =
        lastUserMsg && typeof lastUserMsg.content === 'string'
          ? lastUserMsg.content
          : ''
      const downloadHint = lastUserText
        ? getDownloadTriggerHint(lastUserText, { ...downloadConfig, platform: 'web' })
        : ''
      let configHint = ''
      if (downloadConfig) {
        const strategyMap: Record<string, string> = {
          fastest: '自动（并行竞赛）',
          oa_first: 'OA优先',
          scihub_only: 'Sci-Hub',
          legal_only: '仅合法来源',
        }
        configHint = `\n\n【下载配置】模式: ${downloadConfig.batchMode ? '批量下载' : '单篇下载'} | 策略: ${strategyMap[downloadConfig.strategy || 'fastest'] || downloadConfig.strategy}。请严格按此配置执行。`
      }

      const hintedMessages = downloadHint || configHint
        ? messages.map((m) =>
            m === lastUserMsg ? { ...m, content: m.content + downloadHint + configHint } : m
          )
        : messages

      // 注入强制搜索验证的 system prompt（叠加在 Gateway 核心 prompt 之上）
      const searchEnforcementPrompt = `【强制执行】本对话涉及学术论文查询/下载。你必须遵循以下规则：
1. 绝对禁止基于模型记忆直接回答论文标题、作者、DOI 等信息。
2. 必须先调用 mcp_semantic_scholar_search_papers 或 mcp_paper_search_search_research 搜索验证。
3. 只有在获得搜索结果后，才能基于搜索到的真实信息回答用户。
4. 如果搜索失败，明确告知用户"搜索服务暂时不可用"，而不是给出可能错误的答案。`

      const enrichedMessages = [
        { role: 'system' as const, content: searchEnforcementPrompt },
        ...hintedMessages,
      ]

      const hermesResult = await callHermesGatewayStream(enrichedMessages as ChatMessage[], {
        personality: 'technical',
        timeout: 180_000,
        maxTokens: 4096,
        temperature: 0.7,
      })

      if ('error' in hermesResult) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: hermesResult.error } },
          { status: 500 }
        )
      }

      return new Response(hermesResult, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Default: chat
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'INVALID_REQUEST', message: '消息不能为空' },
        },
        { status: 400 }
      )
    }

    // Enhance with RAG context if enabled
    let enhancedMessages = messages
    let ragSources: SearchResult[] | null = null

    if (useRag && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
      if (lastUserMessage && typeof lastUserMessage.content === 'string') {
        const { context: ragContextText, sources } = await getContextForQuery(
          lastUserMessage.content
        )
        if (ragContextText) {
          ragSources = sources || null
          enhancedMessages = messages.map((m) => {
            if (m.role === 'user') {
              return {
                ...m,
                content: `${m.content}\n\n【相关知识背景】\n${ragContextText}`,
              }
            }
            return m
          })
        }
      }
    }

    // Inject file attachments (PDF text extraction etc.)
    const messagesWithFiles = await injectFileAttachments(enhancedMessages, attachments)

    // Convert image attachments to vision format
    const visionMessages = await buildVisionMessages(messagesWithFiles, attachments)

    // 论文下载意图 → 路由到 Hermes Gateway（scansci-pdf MCP）
    const lastUserMsg = [...visionMessages].reverse().find((m) => m.role === 'user')
    const lastUserText =
      lastUserMsg && typeof lastUserMsg.content === 'string'
        ? lastUserMsg.content
        : lastUserMsg
          ? (lastUserMsg.content as Array<{ type: string; text?: string }>)
              .filter((c) => c.type === 'text')
              .map((c) => c.text)
              .join('')
          : ''
    const shouldUseHermesForDownload = isPaperDownloadIntent(lastUserText)

    if (shouldUseHermesForDownload && useStream) {
      // 注入前端下载配置（如果存在）
      const downloadConfig = body.downloadConfig as { batchMode?: boolean; strategy?: string } | undefined

      // 注入下载触发提示，强化 Gateway 调用 scansci-pdf 的意愿
      const downloadHint = lastUserText ? getDownloadTriggerHint(lastUserText, { ...downloadConfig, platform: 'web' }) : ''
      let configHint = ''
      if (downloadConfig) {
        const strategyMap: Record<string, string> = {
          fastest: '自动（并行竞赛）',
          oa_first: 'OA优先',
          scihub_only: 'Sci-Hub',
          legal_only: '仅合法来源',
        }
        configHint = `\n\n【下载配置】模式: ${downloadConfig.batchMode ? '批量下载' : '单篇下载'} | 策略: ${strategyMap[downloadConfig.strategy || 'fastest'] || downloadConfig.strategy}。请严格按此配置执行。`
      }

      const hintedMessages = downloadHint || configHint
        ? visionMessages.map((m) =>
            m === lastUserMsg ? { ...m, content: m.content + downloadHint + configHint } : m
          )
        : visionMessages

      // 注入强制搜索验证的 system prompt（叠加在 Gateway 核心 prompt 之上）
      const searchEnforcementPrompt = `【强制执行】本对话涉及学术论文查询/下载。你必须遵循以下规则：
1. 绝对禁止基于模型记忆直接回答论文标题、作者、DOI 等信息。
2. 必须先调用 mcp_semantic_scholar_search_papers 或 mcp_paper_search_search_research 搜索验证。
3. 只有在获得搜索结果后，才能基于搜索到的真实信息回答用户。
4. 如果搜索失败，明确告知用户"搜索服务暂时不可用"，而不是给出可能错误的答案。`

      const enrichedMessages = [
        { role: 'system' as const, content: searchEnforcementPrompt },
        ...hintedMessages,
      ]

      const hermesResult = await callHermesGatewayStream(enrichedMessages as ChatMessage[], {
        personality: 'technical',
        timeout: 180_000,
        maxTokens: 4096,
        temperature: 0.7,
      })

      if ('error' in hermesResult) {
        console.warn('[Workshop] Hermes download routing failed:', hermesResult.error)
        // Fallback to normal ZAI flow below
      } else {
        // Hermes SSE 透传给前端
        return new Response(hermesResult, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }
    }

    // Streaming response
    if (useStream) {
      const systemPrompt = getSystemPrompt(mode)
      const streamResult = await chatWithAIStream(visionMessages, systemPrompt)

      if ('error' in streamResult) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: streamResult.error } },
          { status: 500 }
        )
      }

      // Transform the stream to SSE format
      const reader = streamResult.getReader()
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const MAX_CHUNKS = 10000
            const MAX_STREAM_MS = 5 * 60 * 1000
            const startTime = Date.now()
            let chunkCount = 0

            while (true) {
              const { done, value } = await reader.read()
              chunkCount++

              if (done) {
                // Send RAG sources at the end
                if (ragSources && ragSources.length > 0) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ ragContext: ragSources })}\n\n`)
                  )
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
                break
              }

              // 防护1：块数超限（防止无限空数据流）
              if (chunkCount > MAX_CHUNKS) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream chunk limit exceeded' })}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
                break
              }

              // 防护2：总时间超限
              if (Date.now() - startTime > MAX_STREAM_MS) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream timeout after 5 minutes' })}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
                break
              }

              // Forward the chunk
              controller.enqueue(value)
            }
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Non-streaming response
    const systemPrompt = getSystemPrompt(mode)
    const result = context
      ? await chatWithContext(visionMessages, context)
      : await chatWithAI(visionMessages, systemPrompt)

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'AI_ERROR', message: result.error },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        ragContext: ragSources,
      },
      meta: { ragSourceCount: ragSources?.length ?? 0 },
    })
  } catch (error) {
    console.error('POST /api/v1/ai/chat error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '服务器内部错误',
        },
      },
      { status: 500 }
    )
  }
}

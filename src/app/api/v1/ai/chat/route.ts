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
import { getContextForQuery } from '@/lib/ai/rag-service'
import { agentModes, type AgentMode } from '@/lib/ai/agent-modes'
import { readFileSync } from 'fs'
import path from 'path'
import { guardDepth } from '@/lib/utils/loop-guard'
import { extractTextFromPdf, isPdfAttachment } from '@/lib/utils/pdf-parser'
import { processImageMarkers } from '@/lib/ai/zai-service'

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
      console.log('[vision] URL not in /uploads/:', pathname)
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

    console.log('[vision] Converted image to base64:', filename, 'size:', buffer.length, 'mime:', mimeType)
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
  console.log('[vision] buildVisionMessages called, attachments:', attachments?.length || 0)
  if (!attachments || attachments.length === 0) return messages

  const imageAttachments = attachments.filter((a) => a.type === 'image')
  console.log('[vision] image attachments:', imageAttachments.length)
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
    console.log('[vision] Processing image:', att.url)
    const base64 = await getImageBase64(att.url)
    if (base64) {
      console.log('[vision] Added base64 image, length:', base64.length)
      content.push({ type: 'image_url', image_url: { url: base64 } })
    }
  }

  console.log('[vision] Final content parts:', content.length)
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
      console.log('[pdf] Extracting text from PDF:', att.name, att.url)
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

      console.log('[paper_generation] topic length:', topic.length, 'content length:', content.length, 'stage:', stage, 'useHermes:', useHermes)

      // 提取图片附件并转为 base64（用于数据/图表阶段的视觉分析）
      let imageBase64List: string[] = []
      if (attachments && attachments.length > 0) {
        const imageAttachments = attachments.filter((a) => a.type === 'image')
        for (const att of imageAttachments) {
          const base64 = await getImageBase64(att.url)
          if (base64) imageBase64List.push(base64)
        }
        if (imageBase64List.length > 0) {
          console.log(`[paper_generation] Attached ${imageBase64List.length} images for data analysis`)
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
          console.log('[paper_generation] Generated', imageResult.generatedCount, 'images')
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
    let ragSources: Array<{ id: string; title: string; source?: string | null }> | null = null

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
      meta: null,
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

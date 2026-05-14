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
} from '@/lib/ai/claude-service'
import type { ChatMessage, VisionContent } from '@/lib/ai/claude-service'
import { getContextForQuery } from '@/lib/ai/rag-service'
import { agentModes, type AgentMode } from '@/lib/ai/agent-modes'
import { readFileSync } from 'fs'
import path from 'path'

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
    }

    // Handle special actions
    if (action === 'analyze' && body.content) {
      const result = await analyzePaper(body.content)
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
      const result = body.useHermes
        ? await grantApplicationWithHermes(topic, body.context)
        : await grantApplication(topic, body.context)
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

    if (action === 'survey') {
      const result = await surveyGeneration(
        body.topic || messages?.[messages.length - 1]?.content || '',
        body.context
      )
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
      const result = body.useHermes
        ? await peerReviewWithHermes(content, body.focus)
        : await peerReview(content, body.focus)
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

    if (action === 'paper_generation') {
      const topic = body.topic || messages?.[messages.length - 1]?.content || ''
      const stage = body.stage || 'proposal'

      let result
      if (body.useHermes) {
        result = await generatePaperWithHermes(stage, {
          topic,
          content: body.content,
          background: body.background,
          section: body.section,
          wordCount: body.wordCount,
          format: body.format,
        })
      } else {
        result = await generatePaper(stage, {
          topic,
          content: body.content,
          background: body.background,
          section: body.section,
          wordCount: body.wordCount,
          dataDescription: body.dataDescription,
          analysisGoal: body.analysisGoal,
          format: body.format,
        })
      }

      if (result.error) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'AI_ERROR', message: result.error } },
          { status: 500 }
        )
      }

      // Hermes 增强版会返回引用验证结果
      const responseData: Record<string, unknown> = { content: result.content }
      if ('citations' in result && result.citations) {
        responseData.citations = result.citations
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

    // Convert image attachments to vision format
    const visionMessages = await buildVisionMessages(enhancedMessages, attachments)

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
            while (true) {
              const { done, value } = await reader.read()
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
      : await chatWithAI(visionMessages)

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

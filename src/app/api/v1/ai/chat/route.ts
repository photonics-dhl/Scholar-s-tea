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
} from '@/lib/ai/claude-service'
import { getContextForQuery } from '@/lib/ai/rag-service'
import { agentModes, type AgentMode } from '@/lib/ai/agent-modes'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
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
    } = body as {
      messages?: ChatMessage[]
      action?: 'analyze' | 'suggest' | 'grant' | 'survey'
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
      const result = await grantApplication(
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
      if (lastUserMessage) {
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

    // Streaming response
    if (useStream) {
      const systemPrompt = getSystemPrompt(mode)
      const streamResult = await chatWithAIStream(enhancedMessages, systemPrompt)

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
      ? await chatWithContext(enhancedMessages, context)
      : await chatWithAI(enhancedMessages)

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

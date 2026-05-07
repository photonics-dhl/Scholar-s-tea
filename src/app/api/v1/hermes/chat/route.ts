import { NextRequest, NextResponse } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stream = false, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: { message: 'messages is required' } },
        { status: 400 }
      );
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
      : [{ role: 'system', content: KAWAII_SYSTEM_PROMPT }, ...messages];

    const apiUrl = `${MINIMAX_BASE_URL}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    };

    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }

    const apiBody = {
      model: 'MiniMax-M2.7',
      messages: enrichedMessages,
      stream: stream,
      max_tokens: 2048,
      temperature: 0.7,
    };

    console.log('[Hermes] Calling MiniMax API, stream:', stream, 'messages count:', enrichedMessages.length);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(apiBody),
    });

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

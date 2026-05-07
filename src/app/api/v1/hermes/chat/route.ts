import { NextRequest, NextResponse } from 'next/server';

const HERMES_URL = process.env.HERMES_API_URL || 'http://localhost:8642/v1/chat/completions';
const HERMES_API_KEY = process.env.HERMES_API_KEY || '';

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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (HERMES_API_KEY) {
      headers['Authorization'] = `Bearer ${HERMES_API_KEY}`;
    }

    if (sessionId) {
      headers['X-Hermes-Session-Id'] = sessionId;
    }

    // If streaming, return a readable stream
    if (stream) {
      const response = await fetch(HERMES_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'hermes-agent',
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { success: false, error: { message: error || 'Hermes request failed' } },
          { status: response.status }
        );
      }

      // Forward the SSE stream
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming
    const response = await fetch(HERMES_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'hermes-agent',
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: { message: error || 'Hermes request failed' } },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Hermes proxy error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

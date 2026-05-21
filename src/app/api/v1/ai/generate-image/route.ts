import { NextRequest, NextResponse } from 'next/server'
import { generateImageWithZAI, imageUrlToBase64 } from '@/lib/ai/zai-service'

/**
 * POST /api/v1/ai/generate-image
 * 调用 GLM-Image 生成图片，返回 base64
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, size = '1024x1024', quality = 'standard' } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'prompt 不能为空' } },
        { status: 400 }
      )
    }

    const result = await generateImageWithZAI(prompt, { size, quality })

    if (result.error) {
      return NextResponse.json(
        { success: false, error: { code: 'IMAGE_GEN_ERROR', message: result.error } },
        { status: 500 }
      )
    }

    // 优先返回 base64，否则下载 URL 转 base64
    let base64: string | null = null
    if (result.b64_json) {
      base64 = `data:image/png;base64,${result.b64_json}`
    } else if (result.url) {
      base64 = await imageUrlToBase64(result.url)
    }

    if (!base64) {
      return NextResponse.json(
        { success: false, error: { code: 'IMAGE_DOWNLOAD_ERROR', message: '图片数据获取失败' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { base64, prompt },
    })
  } catch (error) {
    console.error('POST /api/v1/ai/generate-image error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '服务器内部错误',
        },
      },
      { status: 500 }
    )
  }
}

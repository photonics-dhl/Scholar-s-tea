import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { extractTextFromPdfBuffer } from '@/lib/utils/pdf-parser'

/**
 * 从前端直传的 PDF 文件中提取文本内容
 * POST /api/v1/ai/extract-pdf
 * Body: FormData { file: File, maxLength?: string }
 *
 * 优化：前端直接上传文件 Buffer，省去中间 /api/v1/upload 的磁盘 I/O 步骤
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Allow both authenticated and guest users for workshop features

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const maxLength = parseInt(
      (formData.get('maxLength') as string) || '30000',
      10
    )

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: '未选择文件' } },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: { message: '仅支持 PDF 文件' } },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('[extract-pdf] Parsing PDF:', file.name, 'size:', buffer.length, 'maxLength:', maxLength)
    const result = await extractTextFromPdfBuffer(buffer, maxLength)
    console.log(
      '[extract-pdf] Parsed:',
      result.numpages,
      'pages, total length:',
      result.totalLength,
      'returned length:',
      result.text.length,
      'truncated:',
      result.wasTruncated
    )

    if (result.error) {
      return NextResponse.json(
        { success: false, error: { message: result.error } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        text: result.text,
        pages: result.numpages,
        filename: file.name,
        totalLength: result.totalLength,
        wasTruncated: result.wasTruncated,
      },
    })
  } catch (error) {
    console.error('[extract-pdf] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'PDF 解析失败',
        },
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

// Simple file upload endpoint - stores files in public/uploads
// In production, this should use MinIO/S3
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'FILE';

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: '未选择文件' } },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: '文件大小超过 10MB 限制' } },
        { status: 400 }
      );
    }

    // Validate image types
    if (type === 'IMAGE') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: { message: '仅支持 JPG/PNG/GIF/WebP 格式' } },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin';
    const uuid = randomUUID();
    const filename = `${uuid}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Build URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'http';
    const url = `${protocol}://${host}/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: { message: '上传失败' } },
      { status: 500 }
    );
  }
}

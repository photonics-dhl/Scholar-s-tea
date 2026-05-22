import { NextResponse } from 'next/server'

interface ApiError {
  code: string
  message: string
}

interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: ApiError | null
  meta?: Record<string, unknown> | null
}

/**
 * 标准化成功响应
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: meta ?? null,
  }
  return NextResponse.json(response, { status })
}

/**
 * 标准化错误响应
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  logError?: Error | unknown
) {
  if (logError) {
    console.error(`[API Error] ${code}:`, logError)
  }

  const response: ApiResponse = {
    success: false,
    data: null,
    error: { code, message },
    meta: null,
  }
  return NextResponse.json(response, { status })
}

/**
 * 常用错误响应快捷方式
 */
export const apiErrors = {
  unauthorized: (message = '请先登录') =>
    errorResponse('UNAUTHORIZED', message, 401),

  forbidden: (message = '无权访问') =>
    errorResponse('FORBIDDEN', message, 403),

  notFound: (message = '资源不存在') =>
    errorResponse('NOT_FOUND', message, 404),

  validation: (message: string) =>
    errorResponse('VALIDATION_ERROR', message, 400),

  conflict: (message: string) =>
    errorResponse('CONFLICT', message, 409),

  internal: (error?: Error | unknown, message = '服务器内部错误') =>
    errorResponse('INTERNAL_ERROR', message, 500, error),
} as const

/**
 * SSE 流式 think 标签过滤
 *
 * 处理 OpenAI 兼容 SSE 格式，实时过滤掉 content 中的 <think>...</think> 内容。
 * 支持 think 标签跨越多个 SSE chunk / 事件。
 */

/** 创建 SSE 流式 think 标签过滤 TransformStream */
export function createThinkStrippingStream(): TransformStream<Uint8Array, Uint8Array> {
  // 兼容 Node.js（stream/web）和浏览器环境
  const TS =
    typeof TransformStream !== 'undefined'
      ? TransformStream
      : typeof window === 'undefined'
        ? require('stream/web').TransformStream
        : undefined

  if (!TS) {
    throw new Error('TransformStream not available in this environment')
  }

  let buffer = ''
  let inThinkBlock = false

  return new TS({
    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
      buffer += new TextDecoder().decode(chunk, { stream: true })

      // 处理所有完整的 SSE 事件（以 \n\n 分隔）
      while (true) {
        const eventEnd = buffer.indexOf('\n\n')
        if (eventEnd === -1) break

        const eventText = buffer.slice(0, eventEnd)
        buffer = buffer.slice(eventEnd + 2)

        const result = processSSEEvent(eventText, inThinkBlock)
        if (result.output !== null) {
          controller.enqueue(new TextEncoder().encode(result.output + '\n\n'))
        }
        inThinkBlock = result.inThinkBlock
      }
    },
    flush(controller: TransformStreamDefaultController<Uint8Array>) {
      if (buffer) {
        const result = processSSEEvent(buffer, inThinkBlock)
        if (result.output !== null) {
          controller.enqueue(new TextEncoder().encode(result.output + '\n\n'))
        }
      }
    },
  })
}

/** 处理单个 SSE 事件，返回过滤后的文本和 think 状态 */
function processSSEEvent(
  eventText: string,
  inThinkBlock: boolean
): { output: string | null; inThinkBlock: boolean } {
  const lines = eventText.split('\n')
  const dataPrefix = 'data: '
  const dataIndices: number[] = []

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(dataPrefix)) {
      dataIndices.push(i)
    }
  }

  // 没有 data 行，透传
  if (dataIndices.length === 0) {
    return { output: eventText, inThinkBlock }
  }

  const dataContents = dataIndices.map((i) => lines[i].slice(dataPrefix.length))
  const fullData = dataContents.join('\n')

  // [DONE] 信号直接透传并重置状态
  if (fullData.trim() === '[DONE]') {
    return { output: eventText, inThinkBlock: false }
  }

  // 尝试解析 JSON
  try {
    // 清理 SSE 数据中可能包含的非法控制字符
    const cleanData = fullData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    const parsed = JSON.parse(cleanData)
    const { json, inThinkBlock: newState, hasContent } = filterThinkInJSON(
      parsed,
      inThinkBlock
    )

    if (!json) {
      return { output: null, inThinkBlock: newState }
    }

    // 过滤后 content 为空，跳过该事件节省带宽
    if (!hasContent) {
      return { output: null, inThinkBlock: newState }
    }

    const newDataLine = `data: ${JSON.stringify(json)}`
    const otherLines = lines.filter((_, i) => !dataIndices.includes(i))
    const output = [...otherLines, newDataLine].join('\n')
    return { output, inThinkBlock: newState }
  } catch {
    // JSON 解析失败（可能格式异常），透传原始内容
    return { output: eventText, inThinkBlock }
  }
}

/** 递归过滤 JSON 对象中的 content / thinking 字段 */
function filterThinkInJSON(
  obj: unknown,
  inThinkBlock: boolean
): { json: unknown | null; inThinkBlock: boolean; hasContent: boolean } {
  if (!obj || typeof obj !== 'object') {
    return { json: obj, inThinkBlock, hasContent: true }
  }

  let hasContent = false

  // OpenAI 兼容格式：choices[].delta.content
  if (
    'choices' in obj &&
    Array.isArray((obj as Record<string, unknown>).choices)
  ) {
    const choices = (obj as Record<string, unknown>).choices as unknown[]
    const newChoices = choices.map((choice: unknown) => {
      if (!choice || typeof choice !== 'object') return choice
      const c = choice as Record<string, unknown>

      // delta.content (OpenAI streaming)
      if (
        c.delta &&
        typeof c.delta === 'object' &&
        typeof (c.delta as Record<string, unknown>).content === 'string'
      ) {
        const content = (c.delta as Record<string, unknown>).content as string
        const { text, inThinkBlock: newState } = filterThinkText(content, inThinkBlock)
        inThinkBlock = newState
        if (text !== null && text !== '') {
          hasContent = true
        }
        return {
          ...c,
          delta: { ...(c.delta as object), content: text ?? '' },
        }
      }

      // delta.thinking (Anthropic reasoning) — 独立字段，不混入 <think> 状态机
      if (
        c.delta &&
        typeof c.delta === 'object' &&
        typeof (c.delta as Record<string, unknown>).thinking === 'string'
      ) {
        return {
          ...c,
          delta: { ...(c.delta as object), thinking: '' },
        }
      }

      // delta.reasoning_content (GLM-5.1 / ZAI reasoning) — 独立字段，不混入 <think> 状态机
      if (
        c.delta &&
        typeof c.delta === 'object' &&
        typeof (c.delta as Record<string, unknown>).reasoning_content === 'string'
      ) {
        return {
          ...c,
          delta: { ...(c.delta as object), reasoning_content: '' },
        }
      }

      // message.content (非流式 / 备选格式)
      if (
        c.message &&
        typeof c.message === 'object' &&
        typeof (c.message as Record<string, unknown>).content === 'string'
      ) {
        const content = (c.message as Record<string, unknown>).content as string
        const { text, inThinkBlock: newState } = filterThinkText(content, inThinkBlock)
        inThinkBlock = newState
        if (text !== null && text !== '') {
          hasContent = true
        }
        return {
          ...c,
          message: { ...(c.message as object), content: text ?? '' },
        }
      }

      return choice
    })

    return {
      json: { ...(obj as object), choices: newChoices },
      inThinkBlock,
      hasContent,
    }
  }

  // 递归处理普通对象
  const newObj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === 'choices') {
      newObj[key] = value
    } else if (typeof value === 'object' && value !== null) {
      const result = filterThinkInJSON(value, inThinkBlock)
      newObj[key] = result.json
      inThinkBlock = result.inThinkBlock
      if (result.hasContent) hasContent = true
    } else {
      newObj[key] = value
    }
  }
  return { json: newObj, inThinkBlock, hasContent }
}

/**
 * 文本级别 think 标签过滤状态机
 *
 * 支持：
 * - 完整 <think>...</think> 在同一文本中
 * - <think> 和 </think> 跨越多个 chunk
 * - 多个 think 块
 */
function filterThinkText(
  text: string,
  inThinkBlock: boolean
): { text: string | null; inThinkBlock: boolean } {
  if (inThinkBlock) {
    // 寻找关闭标签
    const closeIndex = text.indexOf('</think>')
    if (closeIndex === -1) {
      // 整个文本都在 think 块内
      return { text: null, inThinkBlock: true }
    }
    // 找到了关闭标签，递归处理关闭标签之后的内容
    const afterThink = text.slice(closeIndex + '</think>'.length)
    return filterThinkText(afterThink, false)
  }

  // 不在 think 块内，寻找开始标签
  const openIndex = text.indexOf('<think>')
  if (openIndex === -1) {
    return { text, inThinkBlock: false }
  }

  const beforeThink = text.slice(0, openIndex)
  const afterOpen = text.slice(openIndex + '<think>'.length)

  // 在同一文本中找关闭标签
  const closeIndex = afterOpen.indexOf('</think>')
  if (closeIndex !== -1) {
    // 找到配对关闭标签，递归处理之后的内容
    const afterThink = afterOpen.slice(closeIndex + '</think>'.length)
    const result = filterThinkText(afterThink, false)
    if (result.text === null) {
      return { text: beforeThink || null, inThinkBlock: false }
    }
    return {
      text: (beforeThink + result.text) || null,
      inThinkBlock: false,
    }
  }

  // 未找到配对关闭标签，think 块跨 chunk
  return { text: beforeThink || null, inThinkBlock: true }
}

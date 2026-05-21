'use client'

import { useState, useRef } from 'react'
import { Gavel, Send, Loader2, BookOpen, Lightbulb, FileText, CheckCircle2, FileX, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { PdfUploadButton } from './PdfUploadButton'

interface PeerReviewPanelProps {
  onSend: (content: string, options?: { action?: string; focus?: string; content?: string; structured?: boolean }) => void
  loading: boolean
}

const FOCUS_OPTIONS = [
  { id: 'full', label: '全面评审', icon: Gavel },
  { id: 'methodology', label: '方法评审', icon: BookOpen },
  { id: 'writing', label: '写作评审', icon: FileText },
  { id: 'suggestions', label: '改进建议', icon: Lightbulb },
]

export function PeerReviewPanel({ onSend, loading }: PeerReviewPanelProps) {
  const [content, setContent] = useState('')
  const [focus, setFocus] = useState('full')
  const [extractedInfo, setExtractedInfo] = useState<{
    filename: string
    pages: number
    totalLength: number
    wasTruncated: boolean
  } | null>(null)
  const pdfContentRef = useRef<string>('')

  const handleExtract = (
    text: string,
    filename: string,
    pages: number,
    totalLength: number,
    wasTruncated: boolean
  ) => {
    pdfContentRef.current = text
    setExtractedInfo({ filename, pages, totalLength, wasTruncated })
  }

  const handleRemovePdf = () => {
    pdfContentRef.current = ''
    setExtractedInfo(null)
  }

  const handleSubmit = () => {
    if (loading) return
    const hasPdf = pdfContentRef.current.trim().length > 0
    const hasText = content.trim().length > 0
    if (!hasPdf && !hasText) return

    const focusMap: Record<string, string> = {
      full: '请对这篇论文进行全面的同行评审',
      methodology: '请重点评审研究方法部分，包括实验设计、数据分析、对照组设置',
      writing: '请重点评审写作质量，包括结构、逻辑、语言表达',
      suggestions: '请给出具体的修改建议，帮助提升论文质量',
    }

    // 实际传给 API 的论文内容（PDF + 手动输入）
    const paperContent = hasPdf
      ? hasText
        ? `${content.trim()}\n\n${pdfContentRef.current.trim()}`
        : pdfContentRef.current.trim()
      : content.trim()

    // 构建显示在对话框中的友好摘要消息
    let displayMessage = ''
    if (extractedInfo) {
      const { filename, pages, totalLength, wasTruncated } = extractedInfo
      displayMessage = `📄 已上传论文《${filename}》，共 ${pages} 页，约 ${totalLength.toLocaleString()} 字符`
      if (wasTruncated) {
        displayMessage += '（已智能提取关键章节）'
      }
      displayMessage += '，正在启动 AI 审稿……'
    }
    if (hasText) {
      displayMessage += displayMessage
        ? `\n\n💬 补充说明：${content.trim()}`
        : `💬 ${content.trim()}`
    }

    onSend(displayMessage || content.trim(), {
      action: 'peer_review',
      focus: focusMap[focus] || focusMap.full,
      content: paperContent,
      structured: true,
    })

    // 清空状态
    setContent('')
    setExtractedInfo(null)
    pdfContentRef.current = ''
  }

  return (
    <div className="space-y-4">
      {/* Focus selector */}
      <div className="flex flex-wrap gap-2">
        {FOCUS_OPTIONS.map((option) => {
          const Icon = option.icon
          const isActive = focus === option.id
          return (
            <Button
              key={option.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFocus(option.id)}
              className={cn(
                'gap-1.5 transition-all duration-200',
                isActive && 'bg-convo-blue hover:bg-convo-blue/90 text-white shadow-sm'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </Button>
          )
        })}
      </div>

      {/* PDF Upload & Input area */}
      <Card className="border-convo-blue/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gavel className="h-4 w-4 text-convo-blue" />
            论文内容
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* PDF Upload */}
          <div className="flex items-center gap-3">
            <PdfUploadButton
              onExtract={handleExtract}
              disabled={loading}
            />
            {extractedInfo && (
              <div className="flex items-center gap-2 rounded-lg border border-tea-primary/20 bg-tea-primary/5 px-3 py-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-tea-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{extractedInfo.filename}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {extractedInfo.pages} 页 · {extractedInfo.totalLength.toLocaleString()} 字符
                    {extractedInfo.wasTruncated && (
                      <span className="text-amber-600 ml-1">（已截断）</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleRemovePdf}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  title="移除"
                >
                  <FileX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={extractedInfo
              ? '已提取 PDF 内容，可在此补充说明或特定关注点（可选）…'
              : '请粘贴论文内容，或上传 PDF 文件让 AI 自动提取。支持分段粘贴，AI 将综合评审。'
            }
            className="min-h-[120px] resize-y text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {content.length} 字符
              </Badge>
              {extractedInfo && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  PDF 已提取
                </Badge>
              )}
              {content.length > 50000 && (
                <Badge variant="destructive" className="text-xs">
                  超过 50000 字符将截断
                </Badge>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && !extractedInfo) || loading}
              className="gap-2 bg-convo-blue hover:bg-convo-blue/90 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? '评审中…' : '开始评审'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5 border border-border/30">
        <p className="font-medium text-foreground flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          使用提示
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          <p>• 直接上传 PDF，AI 自动提取并评审</p>
          <p>• 粘贴论文内容越完整，评审越准确</p>
          <p>• 支持分段多次粘贴，AI 会综合所有内容</p>
          <p>• 可选择不同的评审侧重点</p>
        </div>
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1 border-t border-border/20 mt-1">
          <AlertTriangle className="h-3 w-3" />
          网络不稳定时大文件可能上传失败，建议将 PDF 拆分为多个小文件或分段粘贴内容
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import {
  PenTool,
  Send,
  Loader2,
  Lightbulb,
  BookOpen,
  FileText,
  BarChart3,
  Download,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  PAPER_GENERATION_STAGES,
  type PaperGenerationStage,
} from '@/lib/ai/paper-generation-prompts'
import { PdfUploadButton } from './PdfUploadButton'
import type { ChatAttachment } from '@/hooks/useChat'

interface PaperGenerationPanelProps {
  onSend: (
    content: string,
    options?: {
      action?: string
      stage?: PaperGenerationStage
      topic?: string
      content?: string
      background?: string
      section?: string
      wordCount?: number
      dataDescription?: string
      analysisGoal?: string
      format?: 'latex' | 'markdown' | 'plain'
      attachments?: ChatAttachment[]
    }
  ) => void
  loading: boolean
}

export function PaperGenerationPanel({ onSend, loading }: PaperGenerationPanelProps) {
  const [stage, setStage] = useState<PaperGenerationStage>('proposal')
  const [topic, setTopic] = useState('')
  const [background, setBackground] = useState('')
  const [section, setSection] = useState('引言')
  const [wordCount, setWordCount] = useState(800)
  const [dataDescription, setDataDescription] = useState('')
  const [analysisGoal, setAnalysisGoal] = useState('')
  const [format, setFormat] = useState<'latex' | 'markdown' | 'plain'>('markdown')
  const [content, setContent] = useState('')
  const [extractedPages, setExtractedPages] = useState(0)
  // 数据图表上传（仅 data 阶段使用）
  const [dataImages, setDataImages] = useState<ChatAttachment[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const currentStageIndex = PAPER_GENERATION_STAGES.findIndex((s) => s.id === stage)
  const StageIcon = [
    Lightbulb,
    BookOpen,
    FileText,
    BarChart3,
    Download,
  ][currentStageIndex]

  const handleSubmit = () => {
    if (!topic.trim() || loading) return

    const options: Parameters<typeof onSend>[1] = {
      action: 'paper_generation',
      stage,
      topic,
    }

    switch (stage) {
      case 'proposal':
        options.background = background
        break
      case 'structure':
        options.content = content
        break
      case 'writing':
        options.section = section
        options.wordCount = wordCount
        options.content = content
        break
      case 'data':
        options.dataDescription = dataDescription
        options.analysisGoal = analysisGoal
        if (dataImages.length > 0) {
          options.attachments = dataImages
        }
        break
      case 'formatting':
        options.content = content
        options.format = format
        break
    }

    onSend(topic, options)
  }

  const uploadImage = async (file: File): Promise<ChatAttachment | null> => {
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(`图片大小超过 10MB 限制`)
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('仅支持 JPG/PNG/GIF/WebP 格式')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'IMAGE')

    const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.success && data.data?.url) {
      return {
        type: 'image',
        url: data.data.url,
        name: file.name,
        size: file.size < 1024 * 1024
          ? (file.size / 1024).toFixed(1) + ' KB'
          : (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      }
    }
    throw new Error(data.error?.message || '上传失败')
  }

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setImageUploading(true)
    setUploadError(null)
    try {
      const newImages: ChatAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const att = await uploadImage(files[i])
        if (att) newImages.push(att)
      }
      setDataImages((prev) => [...prev, ...newImages])
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败'
      setUploadError(msg)
      console.error('Image upload failed:', err)
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setDataImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleExtractPdf = (text: string, _filename: string, pages: number) => {
    setContent((prev) => {
      const separator = prev.trim() ? '\n\n---\n\n' : ''
      return prev + separator + text
    })
    setExtractedPages(pages)
  }

  const canSubmit = () => {
    if (!topic.trim() || loading) return false
    switch (stage) {
      case 'data':
        return !!dataDescription.trim() || dataImages.length > 0
      case 'formatting':
        return !!content.trim()
      default:
        return true
    }
  }

  return (
    <div className="space-y-4">
      {/* Stage Progress */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PAPER_GENERATION_STAGES.map((s, i) => {
          const isActive = s.id === stage
          const isPast = i < currentStageIndex
          return (
            <button
              key={s.id}
              onClick={() => setStage(s.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-convo-blue text-white'
                  : isPast
                    ? 'bg-convo-blue/10 text-convo-blue'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {isPast ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
              )}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Stage Description */}
      <div className="text-xs text-muted-foreground">
        {PAPER_GENERATION_STAGES.find((s) => s.id === stage)?.description}
      </div>

      {/* Input Form */}
      <Card className="border-convo-blue/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StageIcon className="h-4 w-4 text-convo-blue" />
            {PAPER_GENERATION_STAGES.find((s) => s.id === stage)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)' }}>
          {/* Topic (always required) */}
          <div className="space-y-1">
            <label className="text-xs font-medium">论文主题 / 研究方向</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：联邦学习中的隐私保护机制研究"
            />
          </div>

          {/* Stage-specific inputs */}
          {stage === 'proposal' && (
            <div className="space-y-1">
              <label className="text-xs font-medium">研究背景（可选）</label>
              <Textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="简要描述你的研究背景、已有工作、遇到的困难..."
                rows={2}
                className="resize-y min-h-0"
              />
            </div>
          )}

          {stage === 'structure' && (
            <div className="space-y-1">
              <label className="text-xs font-medium">开题报告 / 已有内容（可选）</label>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                上传 PDF 后，AI 将提取内容作为参考资料，用于设计论文结构
              </p>
              <PdfUploadButton onExtract={handleExtractPdf} disabled={loading} />
              {extractedPages > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  已提取 {extractedPages} 页内容
                </div>
              )}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="粘贴已有的开题报告或研究笔记，AI 将据此设计论文结构。也可以上传 PDF 文件。"
                rows={2}
                className="resize-y min-h-0"
              />
            </div>
          )}

          {stage === 'writing' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium">目标章节</label>
                <Input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="例如：引言、相关工作、方法、实验、结论"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">目标字数</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">字</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">上下文 / 已有内容（可选）</label>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  上传参考 PDF 后，AI 将基于其内容进行分析、综合和创造性写作，禁止简单复述原文
                </p>
                <PdfUploadButton onExtract={handleExtractPdf} disabled={loading} />
                {extractedPages > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    已提取 {extractedPages} 页内容
                  </div>
                )}
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="粘贴论文其他章节的内容或写作要点，或上传参考论文 PDF..."
                  rows={2}
                  className="resize-y min-h-0"
                />
              </div>
            </>
          )}

          {stage === 'data' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium">数据描述</label>
                <Textarea
                  value={dataDescription}
                  onChange={(e) => setDataDescription(e.target.value)}
                  placeholder="描述你的数据集：样本量、特征类型、数据来源等"
                  rows={2}
                  className="resize-y min-h-0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">分析目标</label>
                <Input
                  value={analysisGoal}
                  onChange={(e) => setAnalysisGoal(e.target.value)}
                  placeholder="例如：比较不同模型的分类性能"
                />
              </div>

              {/* 数据图表上传 */}
              <div className="space-y-2">
                <label className="text-xs font-medium">数据图表（可选）</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />

                {/* 上传按钮 */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading || loading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors',
                    imageUploading
                      ? 'border-muted bg-muted/30 cursor-wait'
                      : 'border-convo-blue/30 hover:border-convo-blue/60 hover:bg-convo-blue/5 cursor-pointer'
                  )}
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-convo-blue" />
                      <span className="text-muted-foreground">上传中...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-convo-blue" />
                      <span className="text-muted-foreground">
                        点击或拖拽上传数据图表（支持多张）
                      </span>
                    </>
                  )}
                </button>

                {/* 上传错误 */}
                {uploadError && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
                    <span>{uploadError}</span>
                    <button
                      onClick={() => setUploadError(null)}
                      className="ml-auto text-destructive/70 hover:text-destructive underline"
                    >
                      清除
                    </button>
                  </div>
                )}

                {/* 图片预览 */}
                {dataImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dataImages.map((img, i) => (
                      <div
                        key={`${img.url}-${i}`}
                        className="relative group rounded-lg border border-convo-blue/20 overflow-hidden"
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-20 h-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => removeImage(i)}
                            className="p-1 rounded-full bg-white/90 text-destructive hover:bg-white transition-colors"
                            title="删除"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {img.size && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                            {img.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  上传数据图表后，AI 将结合图片内容进行视觉分析，给出更精准的统计方法和图表改进建议
                </p>
              </div>
            </>
          )}

          {stage === 'formatting' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium">输出格式</label>
                <div className="flex gap-2">
                  {(['markdown', 'latex', 'plain'] as const).map((f) => (
                    <Button
                      key={f}
                      variant={format === f ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormat(f)}
                      className={cn(
                        format === f && 'bg-convo-blue hover:bg-convo-blue/90'
                      )}
                    >
                      {f === 'markdown' && 'Markdown'}
                      {f === 'latex' && 'LaTeX'}
                      {f === 'plain' && '纯文本'}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">论文全文</label>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  ⚠️ 此阶段上传 PDF 将被作为<strong>参考材料</strong>处理：AI 会进行分析总结后再格式化输出，不会直接复述原文
                </p>
                <PdfUploadButton onExtract={handleExtractPdf} disabled={loading} />
                {extractedPages > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    已提取 {extractedPages} 页内容
                  </div>
                )}
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="粘贴论文完整内容，AI 将转换为指定格式。也可以上传 PDF 文件自动提取。"
                  rows={3}
                  className="resize-y min-h-0"
                />
              </div>
            </>
          )}

        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2 pb-4 border-t">
          <div className="flex items-center gap-2">
            {currentStageIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setStage(PAPER_GENERATION_STAGES[currentStageIndex - 1].id)
                }
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                上一步
              </Button>
            )}
            {currentStageIndex < PAPER_GENERATION_STAGES.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setStage(PAPER_GENERATION_STAGES[currentStageIndex + 1].id)
                }
              >
                下一步
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="gap-2 bg-convo-blue hover:bg-convo-blue/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? '生成中...' : '开始生成'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

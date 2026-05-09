'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  PAPER_GENERATION_STAGES,
  type PaperGenerationStage,
} from '@/lib/ai/paper-generation-prompts'

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
        break
      case 'formatting':
        options.content = content
        options.format = format
        break
    }

    onSend(topic, options)
  }

  const canSubmit = () => {
    if (!topic.trim() || loading) return false
    switch (stage) {
      case 'data':
        return !!dataDescription.trim()
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
                  ? 'bg-emerald-500 text-white'
                  : isPast
                    ? 'bg-emerald-500/10 text-emerald-600'
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
      <Card className="border-emerald-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StageIcon className="h-4 w-4 text-emerald-500" />
            {PAPER_GENERATION_STAGES.find((s) => s.id === stage)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
                className="min-h-[100px]"
              />
            </div>
          )}

          {stage === 'structure' && (
            <div className="space-y-1">
              <label className="text-xs font-medium">开题报告 / 已有内容（可选）</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="粘贴已有的开题报告或研究笔记，AI 将据此设计论文结构"
                className="min-h-[100px]"
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
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="粘贴论文其他章节的内容或写作要点..."
                  className="min-h-[100px]"
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
                  className="min-h-[100px]"
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
                        format === f && 'bg-emerald-500 hover:bg-emerald-600'
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
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="粘贴论文完整内容，AI 将转换为指定格式"
                  className="min-h-[200px]"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
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
              className="gap-2 bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? '生成中...' : '开始生成'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

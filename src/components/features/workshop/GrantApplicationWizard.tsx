'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Target,
  Lightbulb,
  FlaskConical,
  Trophy,
  Wallet,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GrantApplicationResult } from '@/lib/ai/grant-application-prompts'

interface GrantApplicationWizardProps {
  data: GrantApplicationResult
}

const STEPS = [
  { key: 'background', label: '立项依据', icon: BookOpen },
  { key: 'researchContent', label: '研究内容', icon: Target },
  { key: 'innovation', label: '创新点', icon: Lightbulb },
  { key: 'feasibility', label: '可行性', icon: FlaskConical },
  { key: 'expectedOutcomes', label: '预期成果', icon: Trophy },
  { key: 'budget', label: '预算', icon: Wallet },
  { key: 'timeline', label: '时间线', icon: Calendar },
  { key: 'references', label: '参考文献', icon: FileText },
] as const

export function GrantApplicationWizard({ data }: GrantApplicationWizardProps) {
  const [step, setStep] = useState(0)
  const currentStep = STEPS[step]
  const StepIcon = currentStep.icon
  const totalSteps = STEPS.length

  const handlePrev = () => setStep((s) => Math.max(0, s - 1))
  const handleNext = () => setStep((s) => Math.min(totalSteps - 1, s + 1))

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-white shadow-sm overflow-hidden">
      {/* Header with title + progress */}
      <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <StepIcon className="h-4 w-4 text-journal-primary" />
            {data.title || '科研项目申请书'}
          </h4>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {step + 1} / {totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-journal-primary transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
        {/* Step tabs */}
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isPast = i < step
            return (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-journal-primary text-white'
                    : isPast
                      ? 'bg-journal-primary/10 text-journal-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {isPast ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
        {currentStep.key === 'background' && (
          <BackgroundStep data={data.sections.background} />
        )}
        {currentStep.key === 'researchContent' && (
          <ResearchContentStep data={data.sections.researchContent} />
        )}
        {currentStep.key === 'innovation' && (
          <InnovationStep data={data.sections.innovation} />
        )}
        {currentStep.key === 'feasibility' && (
          <FeasibilityStep data={data.sections.feasibility} />
        )}
        {currentStep.key === 'expectedOutcomes' && (
          <ExpectedOutcomesStep data={data.sections.expectedOutcomes} />
        )}
        {currentStep.key === 'budget' && <BudgetStep data={data.budget} />}
        {currentStep.key === 'timeline' && <TimelineStep data={data.timeline} />}
        {currentStep.key === 'references' && <ReferencesStep data={data.references} />}
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 0}
          className={cn(
            'flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-colors',
            step === 0
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-foreground hover:bg-muted'
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          上一步
        </button>
        <button
          onClick={handleNext}
          disabled={step === totalSteps - 1}
          className={cn(
            'flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-colors',
            step === totalSteps - 1
              ? 'text-muted-foreground cursor-not-allowed'
              : 'bg-journal-primary text-white hover:bg-journal-primary/90'
          )}
        >
          下一步
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Step sub-components
// ------------------------------------------------------------------

function BackgroundStep({ data }: { data: GrantApplicationResult['sections']['background'] }) {
  return (
    <div className="space-y-3">
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{data.content}</div>
      {data.keyPoints.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">核心论点</p>
          {data.keyPoints.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-journal-primary font-bold mt-0.5">{i + 1}.</span>
              <span className="text-foreground leading-relaxed">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResearchContentStep({ data }: { data: GrantApplicationResult['sections']['researchContent'] }) {
  return (
    <div className="space-y-3">
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{data.content}</div>
      {data.objectives.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">研究目标</p>
          {data.objectives.map((o, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <Target className="h-3.5 w-3.5 text-journal-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground leading-relaxed">{o}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InnovationStep({ data }: { data: GrantApplicationResult['sections']['innovation'] }) {
  return (
    <div className="space-y-3">
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{data.content}</div>
      {data.points.length > 0 && (
        <div className="space-y-3">
          {data.points.map((p, i) => (
            <div key={i} className="rounded-lg border border-journal-primary/10 bg-journal-primary/[0.03] p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-journal-primary/10 text-journal-primary font-medium">
                  {p.type}
                </span>
                <span className="text-xs font-semibold text-foreground">{p.content}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium">技术支撑：</span>{p.support}
              </p>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium">预期效果：</span>{p.effect}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FeasibilityStep({ data }: { data: GrantApplicationResult['sections']['feasibility'] }) {
  return (
    <div className="space-y-3">
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{data.content}</div>
      {data.analysis && (
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">可行性分析</p>
          <p className="text-xs text-foreground leading-relaxed">{data.analysis}</p>
        </div>
      )}
    </div>
  )
}

function ExpectedOutcomesStep({ data }: { data: GrantApplicationResult['sections']['expectedOutcomes'] }) {
  return (
    <div className="space-y-3">
      <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{data.content}</div>
      {data.metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.metrics.map((m, i) => (
            <div key={i} className="rounded-lg border border-border/40 p-2.5 space-y-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                {m.type}
              </span>
              <p className="text-xs text-foreground leading-relaxed">{m.description}</p>
              {m.quantity && (
                <p className="text-[11px] text-muted-foreground">数量/级别：{m.quantity}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BudgetStep({ data }: { data: GrantApplicationResult['budget'] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">总预算</span>
        <span className="text-sm font-bold text-journal-primary">{data.total}</span>
      </div>
      {data.breakdown.length > 0 && (
        <div className="space-y-2">
          {data.breakdown.map((b, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/40 p-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{b.category}</span>
                  <span className="text-xs font-semibold text-journal-primary tabular-nums">{b.amount}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{b.justification}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TimelineStep({ data }: { data: GrantApplicationResult['timeline'] }) {
  return (
    <div className="space-y-3">
      {data.phases.length > 0 && (
        <div className="space-y-3">
          {data.phases.map((p, i) => (
            <div key={i} className="relative pl-4 border-l-2 border-journal-primary/20">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-journal-primary" />
              <div className="space-y-1.5 pb-3">
                <span className="text-xs font-semibold text-journal-primary">{p.phase}</span>
                {p.tasks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">研究任务</p>
                    {p.tasks.map((t, j) => (
                      <p key={j} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-muted-foreground">•</span>
                        {t}
                      </p>
                    ))}
                  </div>
                )}
                {p.milestones.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">里程碑</p>
                    {p.milestones.map((m, j) => (
                      <p key={j} className="text-xs text-foreground flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReferencesStep({ data }: { data: GrantApplicationResult['references'] }) {
  return (
    <div className="space-y-2">
      {data.length > 0 ? (
        data.map((ref, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-muted-foreground tabular-nums w-5 text-right">[{i + 1}]</span>
            <span className="text-foreground leading-relaxed">{ref}</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground">无参考文献</p>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { HermesMood } from './AcademicPandaSVG'
import { getLive2DAction, SUSTAINED_MOODS } from './moodToLive2D'

interface Live2DModelRendererProps {
  mood: HermesMood
  size: number
  interactive?: boolean
  isDragging?: boolean
}

/** Cubism 4 coreModel 类型断言辅助 */
function setParam(coreModel: any, id: string, value: number) {
  if (coreModel && typeof coreModel.setParameterValueById === 'function') {
    coreModel.setParameterValueById(id, value)
  }
}

function getParam(coreModel: any, id: string): number {
  if (coreModel && typeof coreModel.getParameterValueById === 'function') {
    return coreModel.getParameterValueById(id)
  }
  return 0
}

export function Live2DModelRenderer({
  mood,
  size,
  interactive = true,
  isDragging,
}: Live2DModelRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<any>(null)
  const modelRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const loadedRef = useRef(false)
  const mouseRef = useRef({ x: 0, y: 0 })
  const lastMoodRef = useRef<HermesMood>('idle')
  const idleTimerRef = useRef<any>(null)

  /* ========== 初始化 PIXI + Live2D ========== */
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!containerRef.current) return

      const PIXI = await import('pixi.js')
      // 暴露 PIXI 到全局，供 Live2D 内部使用
      if (typeof window !== 'undefined') {
        ;(window as any).PIXI = PIXI
      }
      // Cubism 4 运行时（需配合 live2dcubismcore.min.js）
      const { Live2DModel } = await import('pixi-live2d-display/cubism4')

      if (!mounted) return

      const app = new PIXI.Application({
        width: size,
        height: size,
        backgroundAlpha: 0,
        antialias: true,
        resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        autoDensity: true,
        preserveDrawingBuffer: true,
        forceCanvas: true,
      })

      appRef.current = app
      containerRef.current.appendChild(app.view as HTMLCanvasElement)

      try {
        const model = await Live2DModel.from('/live2d/wanko/wanko_touch.model3.json', {
          autoFocus: false,
          autoHitTest: false,
          ticker: PIXI.Ticker.shared,
        })

        if (!mounted) {
          model.destroy()
          return
        }

        modelRef.current = model
        model.anchor.set(0.5, 0.5)
        model.position.set(size / 2, size / 2)

        // 自适应缩放 — 让模型填满容器
        const bounds = model.getBounds()
        const scale = Math.min(size / bounds.width, size / bounds.height) * 1.35
        model.scale.set(scale)

        app.stage.addChild(model)
        loadedRef.current = true

        // 修复 PIXI v7 兼容性：确保 renderer 有 _clippingManager
        const internalModel = model.internalModel as any
        const renderer = internalModel?.renderer
        if (renderer && !renderer._clippingManager) {
          renderer._clippingManager = {
            _currentFrameNo: 0,
            _maskTexture: undefined,
            setGL: () => {},
            getRenderTextureCount: () => 0,
            initialize: () => {},
            release: () => {},
            setupClippingContext: () => {},
            findDrawClip: () => null,
            getClippingContextListForDraw: () => [],
            getClippingContextListForMask: () => [],
          }
        }

        // 不拦截 pointer 事件，让点击穿透到外层 div
        const canvasEl = app.view as HTMLCanvasElement
        if (canvasEl) {
          canvasEl.style.pointerEvents = 'none'
        }

        // 初始 idle
        model.motion('Idle', 0, 1)

        // 自动眨眼由模型的 EyeBlink 组处理（model3.json 中已定义）
      } catch (err) {
        console.error('[Live2D] Failed to load model:', err)
      }
    }

    init()

    return () => {
      mounted = false
      loadedRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true })
        appRef.current = null
      }
      modelRef.current = null
    }
  }, [size, interactive])

  /* ========== 鼠标跟踪 ========== */
  useEffect(() => {
    if (!interactive || !modelRef.current) return

    const model = modelRef.current

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      // 归一化到 [-1, 1]
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)))
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)))
      mouseRef.current = { x: nx, y: ny }
    }

    // 平滑跟随循环
    const tick = () => {
      if (model && model.internalModel) {
        model.focus(mouseRef.current.x, mouseRef.current.y, false)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', handleMouseMove)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [interactive])

  /* ========== mood 变化处理 ========== */
  const applyMood = useCallback(
    async (targetMood: HermesMood) => {
      if (!modelRef.current || !loadedRef.current) return

      const model = modelRef.current
      const action = getLive2DAction(targetMood)
      lastMoodRef.current = targetMood

      // 清除之前的 idle 定时器
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current)
        idleTimerRef.current = null
      }

      // 重置参数（可选）
      if (action.resetParams) {
        const core = model.internalModel?.coreModel
        if (core) {
          setParam(core, 'PARAM_TERE', 0)
          setParam(core, 'PARAM_FACE_01', 0)
          setParam(core, 'PARAM_MOUTH_OPEN_Y', 0)
          setParam(core, 'PARAM_HAND_L', 0)
          setParam(core, 'PARAM_HAND_R', 0)
        }
      }

      // 播放动作
      if (action.motionGroup) {
        try {
          await model.motion(action.motionGroup, action.motionIndex, action.motionPriority ?? 2)
        } catch {
          /* 动作可能不存在，静默失败 */
        }
      }

      // 设置参数
      if (action.parameters) {
        const core = model.internalModel?.coreModel
        action.parameters.forEach((p) => {
          setParam(core, p.id, p.value)
        })
      }

      // 持续型 mood：定时刷新 idle 动作，保持循环
      if (SUSTAINED_MOODS.includes(targetMood) && action.motionGroup === 'Idle') {
        idleTimerRef.current = setInterval(() => {
          if (modelRef.current && lastMoodRef.current === targetMood) {
            const m = modelRef.current
            // 仅在当前没播放其他动作时补充 idle
            if (m.internalModel?.motionManager?.isFinished()) {
              m.motion('Idle', Math.floor(Math.random() * 3), 1).catch(() => {})
            }
          }
        }, 3000)
      }
    },
    []
  )

  useEffect(() => {
    applyMood(mood)
  }, [mood, applyMood])

  /* ========== 拖拽状态 ========== */
  useEffect(() => {
    if (!modelRef.current || !loadedRef.current) return
    const core = modelRef.current.internalModel?.coreModel
    if (!core) return

    if (isDragging) {
      setParam(core, 'PARAM_ANGLE_Z', 12)
      setParam(core, 'PARAM_MOUTH_OPEN_Y', 0.5)
    } else {
      // 拖拽结束后由 mood 处理恢复
      applyMood(lastMoodRef.current)
    }
  }, [isDragging, applyMood])

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : 'default',
        background: 'transparent',
      }}
    />
  )
}

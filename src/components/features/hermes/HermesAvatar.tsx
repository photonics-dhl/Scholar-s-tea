'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { AcademicPandaSVG, type HermesMood as SVGMood } from '@/components/features/hermes/AcademicPandaSVG'
import { PandaParticles } from './PandaParticles'

export type HermesMood = SVGMood

/** 外部命令接口 — 让父组件可以命令 Avatar 执行动作 */
export interface AvatarCommand {
  action:
    | 'wave'
    | 'dance'
    | 'sleep'
    | 'love'
    | 'happy'
    | 'random'
    | 'study'
    | 'insight'
    | 'confused'
    | 'tea'
    | 'inspired'
    | 'debate'
    | 'eureka'
    | 'tea_sip'
  bubble?: string
}

interface HermesAvatarProps {
  size?: number
  mood?: HermesMood
  onClick?: () => void
  onDoubleClick?: () => void
  className?: string
  interactive?: boolean
  isDragging?: boolean
  /** 外部命令 — 传入新对象即触发对应动作 */
  command?: AvatarCommand
  /** 是否启用增强互动效果 */
  enhancedEffects?: boolean
  /** 渲染模式：svg = 熊猫矢量图, live2d = Live2D 模型 */
  renderMode?: 'svg' | 'live2d'
}

/* ============ 气泡消息库 ============ */
const BUBBLES = {
  greeting: [
    '你好呀~ 我是 Hermes！',
    '今天也要努力学习哦 ✨',
    '有什么学术问题问我吧！',
    '嘿嘿~ 好开心见到你！',
    '要一起喝茶聊天吗？🍵',
    '加油加油！你是最棒的！',
  ],
  idle: [
    '在吗在吗？',
    '好无聊呀~',
    '我想喝学者的茶 🍵',
    '你知道吗？茶可以提神哦~',
    '最近在看什么论文呀？',
    '点我点我！我会跳舞~',
    'Zzz... 啊，我没睡着！',
    '这里好安静...',
    '等你好久了呢~',
  ],
  hover: [
    '点我聊天~',
    '握住我拖拽哦',
    '有什么想问的吗？',
    '我在这儿陪着你 ✨',
    '需要帮忙吗？',
    '今天心情怎么样？',
  ],
  drag: [
    '哇啊啊~',
    '我要飞走了！',
    '慢点慢点！',
    '好刺激呀！',
    '抓紧我哦~',
  ],
  dizzy: [
    '头晕晕...',
    '转得好快...',
    '天旋地转...',
    '让我缓一缓...',
  ],
  love: [
    '最喜欢你了！❤️',
    '你对我真好~',
    '么么哒！',
    '好喜欢你呀~',
  ],
  bored: [
    '好无聊...',
    '没人理我...',
    '我要发霉了...',
    '数羊中... 1、2、3...',
  ],
  comfort: {
    encourage: [
      '今天的你已经很棒了，剩下的交给明天~ ✨',
      '不管遇到什么困难，记得我永远支持你！',
      '深呼吸，一切都会好起来的 🌈',
      '你是独一无二的，不要和别人比较~',
      '今天的辛苦是为了明天的绽放，加油！💪',
      '失败只是成功在调皮，再试一次吧！',
      '你的努力我都看在眼里，真的很厉害！',
      '别担心，有我在呢~ 🍵',
    ],
    rest: [
      '累了就休息一下吧，身体最重要~ 🌙',
      '闭上眼睛，想象一片宁静的茶园...',
      '休息不是偷懒，是为了更好地出发~',
      '来杯热茶，放松一下心情吧 🍵',
      '你的大脑也需要喝杯茶歇歇脚~',
    ],
    dance: [
      '啦啦啦~ 跟着音乐摇摆起来！🎵',
      '跳舞是灵魂在微笑~',
      '今天的心情是舞曲节奏的！',
      '旋转跳跃我闭着眼~ ✨',
    ],
    greet: [
      '嗨~ 很高兴见到你！👋',
      '又是美好的一天呢！',
      '见到你我就开心起来了~',
      '来，击个掌！✋',
    ],
    study: [
      '格物致知，学无止境！📚',
      '书中自有黄金屋~',
      '继续加油，知识就是力量！',
      '今天的学习目标完成了吗？',
    ],
    insight: [
      '洞察先机，明察秋毫！🔍',
      '我发现了一个有趣的规律~',
      '知识的力量无穷无尽！',
      '这就是学术的魅力所在~',
    ],
    confused: [
      '这个问题有点难呢...🤔',
      'AI 也有不懂的时候呀~',
      '让我们一起研究研究？',
      '不懂就问，不丢人！',
    ],
    tea: [
      '茶会恭候，随时欢迎！🍵',
      '来杯龙井提提神？',
      '茶香四溢，思绪万千~',
      '喝茶聊天，人生一大乐事~',
    ],
    inspired: [
      '灵感爆棚！💡',
      '我想到一个好主意！',
      '创造力如泉涌~',
      '智慧的火花在闪耀！',
    ],
    debate: [
      '学术辩论，理越辩越明！📖',
      '让我们来一场思想的碰撞~',
      '不同的观点才能激发创新！',
      '真理越辩越明~',
    ],
    eureka: [
      '原来如此！恍然大悟！✨',
      '这就是答案！太棒了！',
      '知识的拼图又完整了一块~',
      '成就感满满！',
    ],
    tea_sip: [
      '茶润学识，口齿留香~ 🍵',
      '好茶配好知识，人生美满~',
      '品味茶香，沉淀思绪...',
      '一杯好茶，一段好时光~',
    ],
  },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ============================================================
   增强版 AI 学术熊猫 Avatar — Live2D 风格交互
   ============================================================ */

export function HermesAvatar({
  size = 56,
  mood: controlledMood,
  onClick,
  onDoubleClick,
  className,
  interactive = true,
  isDragging = false,
  command,
  enhancedEffects = true,
  renderMode = 'live2d',
}: HermesAvatarProps) {
  const [internalMood, setInternalMood] = useState<HermesMood>('idle')
  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [isBouncing, setIsBouncing] = useState(false)
  const [isDancing, setIsDancing] = useState(false)
  const [isWaving, setIsWaving] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [headTilt, setHeadTilt] = useState(0)
  const [dizzyStars, setDizzyStars] = useState(false)
  const [rippleTrigger, setRippleTrigger] = useState(0)
  const [particleTrigger, setParticleTrigger] = useState(0)
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 })
  const [particleType, setParticleType] = useState<'hearts' | 'stars' | 'sparkles' | 'mixed'>('mixed')

  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastInteractRef = useRef<number>(Date.now())
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartTimeRef = useRef<number>(0)
  const commandTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevCommandRef = useRef<AvatarCommand | undefined>(undefined)
  const moodRef = useRef<HermesMood>('idle')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const mood = controlledMood || internalMood

  // 同步 mood 到 ref
  useEffect(() => {
    moodRef.current = mood
  }, [mood])

  // Live2D iframe communication
  useEffect(() => {
    if (renderMode !== 'live2d' || !iframeRef.current) return
    iframeRef.current.contentWindow?.postMessage({ type: 'hermes-mood', mood }, '*')
  }, [mood, renderMode])


  /* ============ 粒子特效触发 ============ */
  const spawnParticles = useCallback((type: 'hearts' | 'stars' | 'sparkles' | 'mixed' = 'mixed') => {
    if (!enhancedEffects || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setParticleOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    setParticleType(type)
    setParticleTrigger(prev => prev + 1)
  }, [enhancedEffects])

  const spawnRipple = useCallback(() => {
    if (!enhancedEffects) return
    setRippleTrigger(prev => prev + 1)
  }, [enhancedEffects])

  /* ============ 工具函数 ============ */
  const resetAction = useCallback(() => {
    setIsDancing(false)
    setIsWaving(false)
    setIsBouncing(false)
    setInternalMood('idle')
  }, [])

  /** 根据气泡文本触发匹配的可爱小动作 */
  const triggerMiniActionFromText = useCallback((text: string, duration: number) => {
    if (moodRef.current !== 'idle') return

    const t = text.toLowerCase()
    let actionTimer: NodeJS.Timeout | null = null

    if (t.includes('茶') || t.includes('tea') || t.includes('喝')) {
      setInternalMood('tea_time')
      spawnParticles('sparkles')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('睡') || t.includes('困') || t.includes('休息') || t.includes('累') || t.includes('zzz')) {
      setInternalMood('sleepy')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('爱') || t.includes('喜欢') || t.includes('么么') || t.includes('❤') || t.includes('♥') || t.includes('💗')) {
      setInternalMood('love')
      spawnParticles('hearts')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('舞') || t.includes('跳') || t.includes('摇摆') || t.includes('舞王') || t.includes('音乐') || t.includes('🎵')) {
      setIsDancing(true)
      setInternalMood('dancing')
      spawnParticles('stars')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('开心') || t.includes('棒') || t.includes('加油') || t.includes('好心情') || t.includes('好棒') || t.includes('赞') || t.includes('✨') || t.includes('耶')) {
      setIsBouncing(true)
      setInternalMood('happy')
      spawnParticles('stars')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('学习') || t.includes('读书') || t.includes('知识') || t.includes('📚') || t.includes('书')) {
      setInternalMood('studying')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('发现') || t.includes('原来') || t.includes('答案') || t.includes('恍然大悟')) {
      setIsBouncing(true)
      setInternalMood('eureka')
      spawnParticles('stars')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('思考') || t.includes('想') || t.includes('🤔') || t.includes('？') || t.includes('?')) {
      setInternalMood('thinking')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('争论') || t.includes('辩论') || t.includes('辩')) {
      setInternalMood('debate')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('灵感') || t.includes('主意') || t.includes('💡')) {
      setInternalMood('inspired')
      spawnParticles('sparkles')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('洞察') || t.includes('观察') || t.includes('🔍')) {
      setInternalMood('insight')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('挥手') || t.includes('嗨') || t.includes('hello') || t.includes('hi') || t.includes('👋') || t.includes('你好')) {
      setIsWaving(true)
      setInternalMood('waving')
      actionTimer = setTimeout(() => {
        setIsWaving(false)
        setInternalMood('idle')
      }, duration)
    } else if (t.includes('生气') || t.includes('哼') || t.includes('😠')) {
      setInternalMood('angry')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('害羞') || t.includes('羞') || t.includes('😳')) {
      setInternalMood('shy')
      spawnParticles('hearts')
      actionTimer = setTimeout(resetAction, duration)
    } else if (t.includes('惊讶') || t.includes('哇') || t.includes('啊') || t.includes('😲')) {
      setInternalMood('surprised')
      spawnParticles('mixed')
      actionTimer = setTimeout(resetAction, duration)
    }

    if (actionTimer) {
      commandTimerRef.current = actionTimer
    }
  }, [resetAction, spawnParticles])

  const showBubble = useCallback((text?: string, duration = 2500) => {
    setSpeechBubble(text || null)
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    if (text) {
      bubbleTimerRef.current = setTimeout(() => setSpeechBubble(null), duration)
      triggerMiniActionFromText(text, duration)
    }
  }, [triggerMiniActionFromText])

  const resetIdleTimer = useCallback(() => {
    lastInteractRef.current = Date.now()
  }, [])

  /* ============ 外部命令处理 ============ */
  useEffect(() => {
    if (!command || command === prevCommandRef.current) return
    prevCommandRef.current = command

    if (commandTimerRef.current) {
      clearTimeout(commandTimerRef.current)
    }

    resetIdleTimer()

    const execute = () => {
      switch (command.action) {
        case 'wave':
          setIsWaving(true)
          setInternalMood('waving')
          spawnParticles('mixed')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.greet), 3000)
          commandTimerRef.current = setTimeout(() => {
            setIsWaving(false)
            setInternalMood('idle')
          }, 3000)
          break

        case 'dance':
          setIsDancing(true)
          setInternalMood('dancing')
          spawnParticles('stars')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.dance), 3000)
          commandTimerRef.current = setTimeout(() => {
            setIsDancing(false)
            setInternalMood('idle')
          }, 4000)
          break

        case 'sleep':
          setInternalMood('sleepy')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.rest), 3500)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 4000)
          break

        case 'love':
          setInternalMood('love')
          spawnParticles('hearts')
          showBubble(command.bubble || pickRandom(BUBBLES.love), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 3500)
          break

        case 'happy':
          setIsBouncing(true)
          setInternalMood('happy')
          spawnParticles('stars')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.encourage), 3500)
          commandTimerRef.current = setTimeout(() => {
            setIsBouncing(false)
            setInternalMood('idle')
          }, 3000)
          break

        case 'study':
          setInternalMood('studying')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.study), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 3500)
          break

        case 'insight':
          setInternalMood('insight')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.insight), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 3500)
          break

        case 'confused':
          setInternalMood('confused')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.confused), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 4000)
          break

        case 'tea':
          setInternalMood('tea_time')
          spawnParticles('sparkles')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.tea), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 3500)
          break

        case 'inspired':
          setInternalMood('inspired')
          spawnParticles('sparkles')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.inspired), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 3500)
          break

        case 'debate':
          setInternalMood('debate')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.debate), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 4000)
          break

        case 'eureka':
          setIsBouncing(true)
          setInternalMood('eureka')
          spawnParticles('stars')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.eureka), 3000)
          commandTimerRef.current = setTimeout(() => {
            setIsBouncing(false)
            setInternalMood('idle')
          }, 3500)
          break

        case 'tea_sip':
          setInternalMood('tea_sipping')
          spawnParticles('sparkles')
          showBubble(command.bubble || pickRandom(BUBBLES.comfort.tea_sip), 3000)
          commandTimerRef.current = setTimeout(() => {
            setInternalMood('idle')
          }, 3500)
          break

        case 'random': {
          const actions: (() => void)[] = [
            () => {
              setIsWaving(true)
              setInternalMood('waving')
              spawnParticles('mixed')
              showBubble('猜猜我要做什么？👋', 2500)
              commandTimerRef.current = setTimeout(() => {
                setIsWaving(false)
                setInternalMood('idle')
              }, 3000)
            },
            () => {
              setIsDancing(true)
              setInternalMood('dancing')
              spawnParticles('stars')
              showBubble('随机舞王登场！💃', 2500)
              commandTimerRef.current = setTimeout(() => {
                setIsDancing(false)
                setInternalMood('idle')
              }, 4000)
            },
            () => {
              setInternalMood('love')
              spawnParticles('hearts')
              showBubble(pickRandom(BUBBLES.love), 2500)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 3500)
            },
            () => {
              setIsBouncing(true)
              setInternalMood('happy')
              spawnParticles('stars')
              showBubble(pickRandom(BUBBLES.comfort.encourage), 3000)
              commandTimerRef.current = setTimeout(() => {
                setIsBouncing(false)
                setInternalMood('idle')
              }, 3000)
            },
            () => {
              setInternalMood('curious')
              showBubble('咦？这是什么？🤔', 2000)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 2500)
            },
            () => {
              setInternalMood('insight')
              showBubble(pickRandom(BUBBLES.comfort.insight), 2500)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 3500)
            },
            () => {
              setInternalMood('tea_time')
              spawnParticles('sparkles')
              showBubble(pickRandom(BUBBLES.comfort.tea), 2500)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 3500)
            },
            () => {
              setInternalMood('eureka')
              spawnParticles('stars')
              showBubble(pickRandom(BUBBLES.comfort.eureka), 2500)
              commandTimerRef.current = setTimeout(() => {
                setInternalMood('idle')
              }, 3500)
            },
          ]
          pickRandom(actions)()
          break
        }
      }
    }

    execute()
  }, [command, showBubble, resetIdleTimer, spawnParticles])

  /* ============ 鼠标交互 ============ */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    resetIdleTimer()
    if (Math.random() > 0.5 && !speechBubble) {
      showBubble(pickRandom(BUBBLES.hover), 2000)
    }
    if (mood === 'idle') {
      setHeadTilt(Math.random() > 0.5 ? 10 : -10)
      setTimeout(() => setHeadTilt(0), 800)
    }
  }, [resetIdleTimer, showBubble, speechBubble, mood])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setHeadTilt(0)
  }, [])

  /* ============ 拖拽反应 ============ */
  useEffect(() => {
    if (isDragging) {
      dragStartTimeRef.current = Date.now()
      setInternalMood('surprised')
      showBubble(pickRandom(BUBBLES.drag), 1500)
      resetIdleTimer()
    } else {
      const dragDuration = Date.now() - dragStartTimeRef.current
      if (dragDuration > 800) {
        setInternalMood('dizzy')
        setDizzyStars(true)
        showBubble(pickRandom(BUBBLES.dizzy), 2500)
        setTimeout(() => {
          setDizzyStars(false)
          setInternalMood('idle')
        }, 3500)
      } else {
        setInternalMood('idle')
      }
    }
  }, [isDragging, showBubble, resetIdleTimer])

  /* ============ 空闲自动小动作 ============ */
  useEffect(() => {
    const checkIdle = () => {
      const elapsed = Date.now() - lastInteractRef.current

      if (elapsed > 45000 && mood === 'idle' && !isDragging && !controlledMood) {
        const actions: (() => void)[] = [
          () => {
            setInternalMood('bored')
            showBubble('哈~ 欠~ 🥱', 2500)
            setTimeout(() => setInternalMood('idle'), 3500)
          },
          () => {
            setHeadTilt(15)
            setTimeout(() => setHeadTilt(-15), 400)
            setTimeout(() => setHeadTilt(0), 800)
          },
          () => {
            showBubble(pickRandom(BUBBLES.idle), 3000)
          },
          () => {
            setInternalMood('sleepy')
            showBubble('Zzz... 好困...', 3000)
            setTimeout(() => setInternalMood('idle'), 4000)
          },
          () => {
            setInternalMood('love')
            spawnParticles('hearts')
            showBubble(pickRandom(BUBBLES.love), 2500)
            setTimeout(() => setInternalMood('idle'), 3500)
          },
          () => {
            setInternalMood('curious')
            showBubble('嗯？什么声音？', 2000)
            setTimeout(() => setInternalMood('idle'), 2500)
          },
          () => {
            setInternalMood('tea_time')
            spawnParticles('sparkles')
            showBubble('来杯茶怎么样？🍵', 2500)
            setTimeout(() => setInternalMood('idle'), 3500)
          },
        ]
        pickRandom(actions)()
      }
    }

    idleTimerRef.current = setInterval(checkIdle, 15000)
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  }, [mood, isDragging, controlledMood, showBubble, resetIdleTimer, spawnParticles])

  /* ============ 点击交互 ============ */
  const doWave = useCallback(() => {
    setIsWaving(true)
    setInternalMood('waving')
    spawnParticles('mixed')
    showBubble('嗨~ 我在这里！👋')
    setTimeout(() => {
      setIsWaving(false)
      setInternalMood('idle')
    }, 1200)
  }, [showBubble, spawnParticles])

  const doDance = useCallback(() => {
    setIsDancing(true)
    setInternalMood('dancing')
    spawnParticles('stars')
    showBubble('啦啦啦~ 看我跳舞！💃')
    setTimeout(() => {
      setIsDancing(false)
      setInternalMood('idle')
    }, 1800)
  }, [showBubble, spawnParticles])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      resetIdleTimer()
      if (!interactive) {
        onClick?.()
        // Forward tap to Live2D iframe so it plays the Tap motion
        if (renderMode === 'live2d' && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'hermes-tap' }, '*')
        }
        return
      }

      const nextCount = clickCount + 1
      setClickCount(nextCount)
      spawnRipple()

      if (nextCount % 3 === 1) {
        setIsBouncing(true)
        setInternalMood('happy')
        spawnParticles('stars')
        showBubble(pickRandom(BUBBLES.greeting))
        setTimeout(() => {
          setIsBouncing(false)
          setInternalMood('idle')
        }, 600)
      } else if (nextCount % 3 === 2) {
        doWave()
      } else {
        doDance()
      }

      onClick?.()
    },
    [clickCount, interactive, onClick, showBubble, doWave, doDance, resetIdleTimer, spawnParticles, spawnRipple]
  )

  /** Internal double-click handler (used by context menu fallback) */
  const handleDoubleClick = useCallback(() => {
    if (!interactive) return
    resetIdleTimer()
    spawnParticles('mixed')
    const actions = [
      doWave,
      doDance,
      () => {
        setInternalMood('sleepy')
        showBubble('Zzz... 我要睡觉觉了~')
        setTimeout(() => setInternalMood('idle'), 2000)
      },
      () => {
        setInternalMood('angry')
        showBubble('哼！别戳我！')
        setTimeout(() => setInternalMood('idle'), 1500)
      },
      () => {
        setInternalMood('shy')
        spawnParticles('hearts')
        showBubble('哎呀，羞羞~')
        setTimeout(() => setInternalMood('idle'), 1500)
      },
      () => {
        setInternalMood('love')
        spawnParticles('hearts')
        showBubble(pickRandom(BUBBLES.love))
        setTimeout(() => setInternalMood('idle'), 2000)
      },
      () => {
        setInternalMood('tea_time')
        spawnParticles('sparkles')
        showBubble('来喝杯茶吧~ 🍵')
        setTimeout(() => setInternalMood('idle'), 2000)
      },
      () => {
        setInternalMood('insight')
        showBubble('我好像发现了什么！🔍')
        setTimeout(() => setInternalMood('idle'), 2000)
      },
    ]
    pickRandom(actions)()
  }, [interactive, doWave, doDance, showBubble, resetIdleTimer, spawnParticles])

  // Live2D iframe tap / double-tap handler
  useEffect(() => {
    if (renderMode !== 'live2d') return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'hermes-tap') {
        handleClick({} as any)
      }
      if (e.data?.type === 'hermes-double-tap') {
        // Prefer external callback (e.g., FloatingChat radial menu)
        onDoubleClick?.()
        // Fall back to internal random action if no external handler
        if (!onDoubleClick) {
          handleDoubleClick()
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [renderMode, handleClick, onDoubleClick, handleDoubleClick])

  /* ============ 右键菜单 ============ */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) return
      e.preventDefault()
      resetIdleTimer()
      spawnParticles('mixed')
      const actions = [
        doWave,
        doDance,
        () => {
          setInternalMood('sleepy')
          showBubble('Zzz... 我要睡觉觉了~')
          setTimeout(() => setInternalMood('idle'), 2000)
        },
        () => {
          setInternalMood('angry')
          showBubble('哼！别戳我！')
          setTimeout(() => setInternalMood('idle'), 1500)
        },
        () => {
          setInternalMood('shy')
          spawnParticles('hearts')
          showBubble('哎呀，羞羞~')
          setTimeout(() => setInternalMood('idle'), 1500)
        },
        () => {
          setInternalMood('love')
          spawnParticles('hearts')
          showBubble(pickRandom(BUBBLES.love))
          setTimeout(() => setInternalMood('idle'), 2000)
        },
        () => {
          setInternalMood('tea_time')
          spawnParticles('sparkles')
          showBubble('来喝杯茶吧~ 🍵')
          setTimeout(() => setInternalMood('idle'), 2000)
        },
        () => {
          setInternalMood('insight')
          showBubble('我好像发现了什么！🔍')
          setTimeout(() => setInternalMood('idle'), 2000)
        },
      ]
      pickRandom(actions)()
    },
    [interactive, doWave, doDance, showBubble, resetIdleTimer, spawnParticles]
  )

  /* ============ 受控 mood 恢复 ============ */
  useEffect(() => {
    if (controlledMood === 'thinking') {
      const timer = setTimeout(() => setInternalMood('idle'), 5000)
      return () => clearTimeout(timer)
    }
  }, [controlledMood])

  /* ============ 清理 ============ */
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
      if (commandTimerRef.current) clearTimeout(commandTimerRef.current)
    }
  }, [])

  const s = size

  // 动画类名
  const animationClass = isDancing
    ? 'animate-hermes-dance'
    : isBouncing
      ? 'animate-hermes-bounce'
      : mood === 'dizzy'
        ? 'animate-hermes-dizzy'
        : mood === 'idle' && !isWaving && !isDragging && !isBouncing
          ? 'animate-hermes-float'
          : ''

  const bodyShake = mood === 'angry' || mood === 'debate' ? 'animate-hermes-shake' : ''

  const isCheerful =
    mood === 'happy' || mood === 'dancing' || mood === 'waving' || mood === 'eureka' || mood === 'inspired'
  const isSleepy = mood === 'sleepy' || mood === 'bored'
  const isThinking = mood === 'thinking' || mood === 'confused' || mood === 'curious'

  return (
    <>
      {/* 粒子特效层 */}
      {enhancedEffects && (
        <PandaParticles
          originX={particleOrigin.x}
          originY={particleOrigin.y}
          trigger={particleTrigger}
          type={particleType}
          count={10}
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          'relative cursor-pointer select-none',
          'transition-transform duration-200',
          animationClass,
          bodyShake,
          className
        )}
        onClick={handleClick}
        onDoubleClick={() => {
          onDoubleClick?.()
          if (renderMode === 'live2d' && iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'hermes-double-tap' }, '*')
          }
        }}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: s,
          height: s,
          transform: headTilt !== 0 ? `rotate(${headTilt}deg)` : undefined,
        }}
        title="点击我呀~（双击也有惊喜）"
      >
        {/* ====== 对话气泡 ====== */}
        {speechBubble && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
            <div className="bg-white/95 text-gray-700 text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 animate-scale-in relative backdrop-blur-sm">
              {speechBubble}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
            </div>
          </div>
        )}

        {/* ====== 涟漪效果 ====== */}
        {enhancedEffects && rippleTrigger > 0 && (
          <span
            key={rippleTrigger}
            className="absolute inset-0 rounded-full border-2 border-tea-primary/40 animate-hermes-ripple pointer-events-none z-10"
          />
        )}

        {/* ====== 渲染层：Live2D 或 SVG ====== */}
        {renderMode === 'live2d' ? (
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: s * 2.2,
              height: s * 2.2,
              left: -s * 0.6,
              top: -s * 0.6,
            }}
            onMouseMove={(e) => {
              if (!iframeRef.current?.contentWindow) return
              const rect = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - rect.left) / rect.width * 2 - 1
              const y = (e.clientY - rect.top) / rect.height * 2 - 1
              iframeRef.current.contentWindow.postMessage({ type: 'hermes-mousemove', x, y }, '*')
            }}
          >
            <iframe
              ref={iframeRef}
              src={`/hermes-live2d.html?size=${Math.round(s * 2.2)}`}
              className="w-full h-full border-0"
              style={{ pointerEvents: 'none' }}
              title="Hermes Live2D"
            />
          </div>
        ) : (
          <div
            className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 shadow-lg"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 3px rgba(255,255,255,0.5)',
            }}
          >
            <AcademicPandaSVG mood={mood} size={s} interactive={interactive && enhancedEffects} />
          </div>
        )}

        {/* ====== 开心/跳舞/灵感时的星星 ====== */}
        {isCheerful && (
          <>
            <span className="absolute -top-1 -left-1 text-xs animate-hermes-twinkle pointer-events-none z-20">✦</span>
            <span className="absolute -top-1 -right-1 text-[10px] animate-hermes-twinkle pointer-events-none z-20" style={{ animationDelay: '0.2s' }}>★</span>
            <span className="absolute top-1/2 -right-2 text-[9px] animate-hermes-twinkle pointer-events-none z-20" style={{ animationDelay: '0.4s' }}>✨</span>
          </>
        )}

        {/* ====== 爱心飘浮 ====== */}
        {mood === 'love' && (
          <>
            <span className="absolute -top-2 -left-2 text-sm text-red-400 animate-hermes-float-heart pointer-events-none z-20">♥</span>
            <span className="absolute -top-1 -right-2 text-xs text-red-400 animate-hermes-float-heart pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>♥</span>
            <span className="absolute -top-3 left-0 text-[10px] text-pink-400 animate-hermes-float-heart pointer-events-none z-20" style={{ animationDelay: '0.6s' }}>♥</span>
          </>
        )}

        {/* ====== 害羞 ====== */}
        {mood === 'shy' && (
          <>
            <span className="absolute -top-1 -left-1 text-xs text-pink-300 animate-hermes-pulse pointer-events-none z-20">💗</span>
            <span className="absolute -top-1 -right-1 text-[10px] text-pink-300 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>💗</span>
          </>
        )}

        {/* ====== 睡觉 Zzz ====== */}
        {isSleepy && (
          <>
            <span className="absolute -top-2 right-0 text-xs text-blue-300 animate-hermes-pulse pointer-events-none z-20">z</span>
            <span className="absolute -top-4 right-2 text-[9px] text-blue-300 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>z</span>
            <span className="absolute -top-6 right-4 text-[8px] text-blue-200 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.6s' }}>z</span>
          </>
        )}

        {/* ====== 无聊叹气 ====== */}
        {mood === 'bored' && (
          <span className="absolute -top-2 right-0 text-[10px] text-gray-400 animate-hermes-pulse pointer-events-none z-20">...</span>
        )}

        {/* ====== 思考问号 ====== */}
        {isThinking && (
          <>
            <span className="absolute -top-2 right-0 text-sm text-amber-500 font-bold animate-hermes-pulse pointer-events-none z-20">?</span>
            <span className="absolute -top-4 right-3 text-[10px] text-amber-400 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.2s' }}>?</span>
          </>
        )}

        {/* ====== 疑惑专属 — 大问号 + 思考云 ====== */}
        {mood === 'confused' && (
          <>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl text-orange-500 font-bold animate-hermes-bounce pointer-events-none z-20">?</span>
            <span className="absolute -top-3 -left-2 text-lg text-amber-400 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.1s' }}>?</span>
            <span className="absolute top-0 -right-3 text-base text-orange-300 animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.3s' }}>?</span>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 text-orange-600 text-[10px] px-2 py-0.5 rounded-full shadow-sm border border-orange-200 animate-scale-in pointer-events-none z-20 whitespace-nowrap">
              嗯？这是什么？
            </div>
          </>
        )}

        {/* ====== 灵感灯泡 ====== */}
        {mood === 'inspired' && (
          <span className="absolute -top-3 right-0 text-base animate-hermes-pulse pointer-events-none z-20">💡</span>
        )}

        {/* ====== 茶壶 ====== */}
        {mood === 'tea_time' && (
          <span className="absolute -top-2 right-0 text-sm animate-hermes-bounce pointer-events-none z-20">🍵</span>
        )}

        {/* ====== 放大镜 ====== */}
        {mood === 'insight' && (
          <span className="absolute -top-2 right-0 text-sm animate-hermes-pulse pointer-events-none z-20">🔍</span>
        )}

        {/* ====== 辩论书本 ====== */}
        {mood === 'debate' && (
          <span className="absolute -top-2 right-0 text-sm animate-hermes-pulse pointer-events-none z-20">📖</span>
        )}

        {/* ====== 眩晕星星 ====== */}
        {dizzyStars && (
          <>
            <span className="absolute top-0 left-0 text-sm text-amber-400 animate-hermes-dizzy-star pointer-events-none z-20">★</span>
            <span className="absolute top-0 right-0 text-xs text-amber-400 animate-hermes-dizzy-star pointer-events-none z-20" style={{ animationDelay: '0.2s' }}>✦</span>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-amber-400 animate-hermes-dizzy-star pointer-events-none z-20" style={{ animationDelay: '0.4s' }}>★</span>
          </>
        )}

        {/* ====== 惊喜 ====== */}
        {mood === 'surprised' && (
          <>
            <span className="absolute -top-1 -left-1 text-xs animate-hermes-pulse pointer-events-none z-20">❗</span>
            <span className="absolute -top-1 -right-1 text-[10px] animate-hermes-pulse pointer-events-none z-20" style={{ animationDelay: '0.15s' }}>❗</span>
          </>
        )}

        {/* ====== 悬浮提示 ====== */}
        {!controlledMood && !speechBubble && isHovered && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-tea-primary text-white px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-scale-in">
            点击聊天~ 右键有菜单哦
          </span>
        )}
      </div>
    </>
  )
}

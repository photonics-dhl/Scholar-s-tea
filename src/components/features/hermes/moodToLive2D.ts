import type { HermesMood } from './AcademicPandaSVG'

export interface Live2DAction {
  /** 动作组名 */
  motionGroup?: string
  /** 动作组内索引，不传则随机 */
  motionIndex?: number
  /** 动作优先级: 1=idle, 2=normal, 3=force */
  motionPriority?: number
  /** 参数覆盖列表 */
  parameters?: { id: string; value: number }[]
  /** 是否重置所有自定义参数 */
  resetParams?: boolean
}

/** wanko 动作组常量 */
const MG = {
  idle: 'Idle',
  flick3: 'Flick3',
  shake: 'Shake',
  flickUp: 'FlickUp',
  tap: 'Tap',
  flick: 'Flick',
  flickLeft: 'FlickLeft',
} as const

/** idle 动作随机索引 */
export function getIdleMotionIndex(): number {
  // Idle 组有 3 个: idle_01(0), idle_03(1), idle_04(2)
  return Math.floor(Math.random() * 3)
}

/**
 * 将 HermesMood 映射到 Live2D 动作 + 参数
 * 设计原则：
 * - 常驻 mood（idle/studying/tea）用 motionGroup + 持续循环
 * - 瞬时 mood（happy/surprised）播放一次动作 + 参数覆盖
 * - 情绪参数用 PARAM_ANGLE_X/Y/Z、PARAM_TERE、PARAM_FACE_01、PARAM_MOUTH_OPEN_Y 等
 */
export function getLive2DAction(mood: HermesMood): Live2DAction {
  switch (mood) {
    case 'idle':
    case 'studying':
    case 'tea_time':
    case 'tea_sipping':
      return {
        motionGroup: MG.idle,
        motionPriority: 1,
        resetParams: true,
      }

    case 'happy':
    case 'eureka':
      return {
        motionGroup: MG.flick3,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.8 },
          { id: 'PARAM_FACE_01', value: 0.3 },
        ],
      }

    case 'inspired':
      return {
        motionGroup: MG.flickUp,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.6 },
          { id: 'PARAM_FACE_01', value: 0.8 },
        ],
      }

    case 'dancing':
      return {
        motionGroup: MG.shake,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.7 },
        ],
      }

    case 'waving':
      return {
        motionGroup: MG.tap,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_HAND_L', value: 1 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.5 },
        ],
      }

    case 'thinking':
    case 'insight':
    case 'curious':
      return {
        motionGroup: MG.idle,
        motionIndex: 0,
        motionPriority: 1,
        parameters: [
          { id: 'PARAM_ANGLE_Y', value: -12 },
          { id: 'PARAM_FACE_01', value: 0.5 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.2 },
        ],
      }

    case 'confused':
      return {
        motionGroup: MG.idle,
        motionIndex: 0,
        motionPriority: 1,
        parameters: [
          { id: 'PARAM_ANGLE_Y', value: -8 },
          { id: 'PARAM_ANGLE_Z', value: -5 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.3 },
        ],
      }

    case 'sleepy':
    case 'bored':
      return {
        motionGroup: MG.idle,
        motionIndex: 0,
        motionPriority: 1,
        parameters: [
          { id: 'PARAM_EYE_L_OPEN', value: 0.15 },
          { id: 'PARAM_EYE_R_OPEN', value: 0.15 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.2 },
          { id: 'PARAM_ANGLE_Y', value: 5 },
        ],
      }

    case 'surprised':
      return {
        motionGroup: MG.flickUp,
        motionPriority: 3,
        parameters: [
          { id: 'PARAM_MOUTH_OPEN_Y', value: 1 },
          { id: 'PARAM_ANGLE_Z', value: 8 },
          { id: 'PARAM_EYE_L_OPEN', value: 1.2 },
          { id: 'PARAM_EYE_R_OPEN', value: 1.2 },
        ],
      }

    case 'love':
      return {
        motionGroup: MG.tap,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_TERE', value: 1 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.5 },
          { id: 'PARAM_ANGLE_Y', value: -5 },
        ],
      }

    case 'angry':
    case 'debate':
      return {
        motionGroup: MG.flick,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_ANGLE_Z', value: 12 },
          { id: 'PARAM_FACE_01', value: 1 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.6 },
          { id: 'PARAM_EYE_L_OPEN', value: 0.9 },
          { id: 'PARAM_EYE_R_OPEN', value: 0.9 },
        ],
      }

    case 'shy':
      return {
        motionGroup: MG.tap,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_TERE', value: 1 },
          { id: 'PARAM_ANGLE_Y', value: -3 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.3 },
          { id: 'PARAM_EYE_L_OPEN', value: 0.7 },
          { id: 'PARAM_EYE_R_OPEN', value: 0.7 },
        ],
      }

    case 'dizzy':
      return {
        motionGroup: MG.flickLeft,
        motionPriority: 2,
        parameters: [
          { id: 'PARAM_ANGLE_Z', value: 18 },
          { id: 'PARAM_MOUTH_OPEN_Y', value: 0.4 },
          { id: 'PARAM_EYE_L_OPEN', value: 0.5 },
          { id: 'PARAM_EYE_R_OPEN', value: 0.5 },
        ],
      }

    default:
      return {
        motionGroup: MG.idle,
        motionPriority: 1,
        resetParams: true,
      }
  }
}

/** 需要持续重置参数的 mood 列表（非动作型） */
export const SUSTAINED_MOODS: HermesMood[] = [
  'idle',
  'studying',
  'tea_time',
  'tea_sipping',
  'sleepy',
  'bored',
  'thinking',
  'insight',
  'curious',
  'confused',
]

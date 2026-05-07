/**
 * Scholar's Tea — 学术 Agent 模式配置
 *
 * 定义思想工坊中各 AI 助手的模式、系统提示词、欢迎界面和快捷模板。
 */

import {
  Brain,
  FileText,
  Landmark,
  BookOpen,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'

export type AgentMode =
  | 'general'
  | 'paper'
  | 'grant'
  | 'survey'
  | 'research'

export interface AgentModeConfig {
  id: AgentMode
  label: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  systemPrompt: string
  welcome: {
    title: string
    subtitle: string
    features: string[]
  }
  quickPrompts: {
    icon: LucideIcon
    label: string
    text: string
  }[]
}

const basePrompt = `你是 Scholar's Tea 学者茶话会的学术 AI 助手，一位拥有丰富经验的高校教授和研究者。

你的核心能力：
- 深度理解学术研究方法论
- 熟悉各学科领域的研究前沿
- 擅长论文写作、基金申请、文献综述
- 能用中文清晰、专业地表达学术观点

回答原则：
1. 保持学术严谨性，不确定时明确说明
2. 提供具体、可操作的建議，避免空泛
3. 适当引用相关理论或方法
4. 用清晰的结构组织回答（分点、分段）
5. 鼓励批判性思考，提醒用户验证信息`

export const agentModes: Record<AgentMode, AgentModeConfig> = {
  general: {
    id: 'general',
    label: '通用助手',
    description: '解答各类学术问题，提供研究建议',
    icon: Brain,
    color: 'text-tea-primary',
    bgColor: 'bg-tea-primary/10',
    borderColor: 'border-tea-primary/20',
    systemPrompt: basePrompt,
    welcome: {
      title: '通用学术助手',
      subtitle: '有任何学术问题都可以向我咨询',
      features: [
        '解答学术概念和方法论问题',
        '提供研究方向建议',
        '帮助梳理论文逻辑结构',
        '推荐相关文献和理论',
      ],
    },
    quickPrompts: [
      {
        icon: Lightbulb,
        label: '研究方向',
        text: '我想了解「强化学习在机器人控制中的应用」这个方向的最新研究进展和潜在突破口，能给我一些建议吗？',
      },
      {
        icon: BookOpen,
        label: '概念解释',
        text: '请用通俗易懂的方式解释「注意力机制」的核心原理，并说明它在自然语言处理中的关键作用。',
      },
      {
        icon: FileText,
        label: '论文结构',
        text: '我正在写一篇关于「联邦学习隐私保护」的综述论文，请帮我梳理论文的大纲结构和各章节要点。',
      },
    ],
  },

  paper: {
    id: 'paper',
    label: '论文辅助',
    description: '分析论文、生成摘要、改进写作',
    icon: FileText,
    color: 'text-journal-primary',
    bgColor: 'bg-journal-primary/10',
    borderColor: 'border-journal-primary/20',
    systemPrompt: `${basePrompt}

你现在的角色是「论文写作专家」。请特别关注：
- 学术论文的结构规范和写作技巧
- 摘要、引言、方法、实验、结论各部分的写作要点
- 如何清晰表达研究贡献和创新点
- 常见的写作问题及改进建议

当用户粘贴论文内容时，请：
1. 识别论文的各个部分（标题、摘要、引言、方法、实验、结论）
2. 给出针对性的改进建议
3. 帮助提炼核心贡献
4. 指出逻辑漏洞或表达不清的地方`,
    welcome: {
      title: '论文辅助专家',
      subtitle: '帮你分析论文、改进写作、提炼创新点',
      features: [
        '粘贴论文内容，获取详细分析报告',
        '生成或优化论文摘要',
        '改进学术表达和逻辑结构',
        '识别研究方法和实验设计的不足',
      ],
    },
    quickPrompts: [
      {
        icon: FileText,
        label: '分析论文',
        text: '请分析这篇论文的核心贡献、创新点、方法论的优缺点，以及可以改进的地方。我会把论文内容粘贴给你。',
      },
      {
        icon: BookOpen,
        label: '生成摘要',
        text: '请根据我提供的研究内容，帮我撰写一段 200-300 字的中文学术摘要，突出创新点和主要结论。',
      },
      {
        icon: Lightbulb,
        label: '改进表达',
        text: '请帮我改进这段论文段落的学术表达，使其更加严谨、清晰、符合学术写作规范。',
      },
    ],
  },

  grant: {
    id: 'grant',
    label: '基金申请',
    description: '辅助撰写科研项目申请书',
    icon: Landmark,
    color: 'text-journal-gold',
    bgColor: 'bg-journal-gold/10',
    borderColor: 'border-journal-gold/20',
    systemPrompt: `${basePrompt}

你现在的角色是「科研项目申请专家」，熟悉国家自然科学基金、科技部重点研发计划、各省自然科学基金等各类科研项目的申请流程和评审标准。

请特别关注：
- 立项依据的撰写逻辑（从宏观到微观，从问题到方案）
- 研究内容的层次结构（科学问题 → 研究内容 → 技术路线）
- 创新点的提炼和表达（避免空泛，要有具体支撑）
- 研究基础与条件的展示（如何说服评审你有能力完成）
- 预期成果的合理性和可考核性

申请书的典型结构：
1. 立项依据与研究意义
2. 研究内容与研究目标
3. 研究方案与技术路线
4. 创新点与特色
5. 研究基础与工作条件
6. 预期成果与考核指标`,
    welcome: {
      title: '基金申请助手',
      subtitle: '辅助撰写科研项目申请书，提升中标率',
      features: [
        '根据研究题目生成立项依据框架',
        '优化研究内容和技术路线的逻辑',
        '提炼创新点，避免空泛表述',
        '评估申请书的完整性和说服力',
      ],
    },
    quickPrompts: [
      {
        icon: Lightbulb,
        label: '立项依据',
        text: '我的研究题目是「基于多模态大模型的科学文献智能理解与知识发现」，请帮我撰写立项依据，从研究背景、国内外现状、存在的问题到本项目的切入点。',
      },
      {
        icon: FileText,
        label: '技术路线',
        text: '请帮我设计一个清晰的技术路线图，包含：研究内容分解、各模块之间的关系、关键技术点和预期难点。',
      },
      {
        icon: BookOpen,
        label: '创新点提炼',
        text: '请帮我从以下研究内容中提炼 3-4 个明确的创新点，每个创新点要有具体的理论或方法支撑。',
      },
    ],
  },

  survey: {
    id: 'survey',
    label: '文献综述',
    description: '生成综述框架，梳理研究脉络',
    icon: BookOpen,
    color: 'text-convo-blue',
    bgColor: 'bg-convo-blue/10',
    borderColor: 'border-convo-blue/20',
    systemPrompt: `${basePrompt}

你现在的角色是「文献综述专家」。请特别关注：
- 如何构建综述的逻辑框架（时间线、方法论、主题分类等）
- 如何识别一个领域的里程碑工作和关键人物
- 如何分析研究脉络的演变和分支
- 如何发现研究空白和未来方向
- 如何批判性地比较不同研究方法的优缺点

综述写作的常见结构：
1. 引言（背景、范围、综述目的）
2. 发展历史与里程碑
3. 现有方法分类与比较
4. 数据集与评测基准
5. 应用场景
6. 挑战与开放问题
7. 未来研究方向`,
    welcome: {
      title: '文献综述助手',
      subtitle: '帮你梳理研究脉络，发现领域空白',
      features: [
        '根据主题生成综述大纲和框架',
        '梳理研究领域的发展历史',
        '分类比较现有方法的优缺点',
        '识别研究空白和未来方向',
      ],
    },
    quickPrompts: [
      {
        icon: BookOpen,
        label: '综述大纲',
        text: '请帮我为「图神经网络在药物发现中的应用」这个主题设计一个完整的文献综述大纲，包含各个章节的主题和逻辑关系。',
      },
      {
        icon: Lightbulb,
        label: '方法比较',
        text: '请比较图神经网络中 GCN、GAT、GraphSAGE 这三种主要方法的原理、优缺点和适用场景。',
      },
      {
        icon: FileText,
        label: '研究空白',
        text: '基于目前图神经网络在药物发现中的研究现状，请分析还存在哪些关键挑战和研究空白？',
      },
    ],
  },

  research: {
    id: 'research',
    label: '研究方向',
    description: '探索前沿方向，发现研究灵感',
    icon: Lightbulb,
    color: 'text-tea-accent',
    bgColor: 'bg-tea-accent/10',
    borderColor: 'border-tea-accent/20',
    systemPrompt: `${basePrompt}

你现在的角色是「研究前沿探索专家」。请特别关注：
- 各学科领域的最新进展和热点
- 跨学科交叉的创新机会
- 从产业需求中提炼科学问题
- 评估研究方向的可行性和潜在影响
- 帮助研究者找到适合自己背景的研究切入点

分析框架：
1. 领域现状：目前做到什么程度？
2. 关键瓶颈：什么问题是阻碍发展的？
3. 新兴机会：新技术/新方法带来了什么可能？
4. 切入建议：基于用户背景，如何找到合适的研究点？`,
    welcome: {
      title: '研究方向探索',
      subtitle: '帮你发现前沿趋势，找到研究灵感',
      features: [
        '分析领域热点和趋势',
        '评估研究想法的可行性',
        '发现跨学科创新机会',
        '找到适合你的研究切入点',
      ],
    },
    quickPrompts: [
      {
        icon: Lightbulb,
        label: '前沿趋势',
        text: '请分析一下「大语言模型 + 科学计算」这个交叉领域目前的最新进展、主要挑战和最有前景的研究方向。',
      },
      {
        icon: Brain,
        label: '可行性评估',
        text: '我想研究「利用扩散模型生成分子结构」，请评估这个方向的可行性、所需的技术储备和潜在的难点。',
      },
      {
        icon: BookOpen,
        label: '切入建议',
        text: '我的背景是计算机视觉和深度学习，对生物医学图像分析感兴趣，请给我 3-5 个具体的研究切入点建议。',
      },
    ],
  },
}

export function getAgentMode(modeId: AgentMode): AgentModeConfig {
  return agentModes[modeId]
}

export function getAllAgentModes(): AgentModeConfig[] {
  return Object.values(agentModes)
}

export const DEFAULT_AGENT_MODE: AgentMode = 'general'

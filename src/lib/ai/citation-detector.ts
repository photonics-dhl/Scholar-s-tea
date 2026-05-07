/**
 * 引用意图语义检测器
 *
 * 检测文本中是否表达了"引用"意图，并提取相关信息
 * 触发词示例：
 * - "引用了" / "cited" / "引用自"
 * - "根据xxx论文" / "据xxx研究"
 * - "受xxx启发" / "inspired by"
 * - "使用了xxx的方法" / "adopted xxx's approach"
 */

// 引用意图触发模式（支持中英文）
const CITATION_PATTERNS = [
  // 中文触发
  /引用[来自]?\s*([^\s，。、；]+?的?论文|[\[【].*?[\]】]|10\.\d+\/\S+)/gi,
  /cited[:：]?\s*/gi,
  /根据\s*([^\s，,]+?(?:论文|研究|工作|成果))/gi,
  /据\s*([^\s，,]+?(?:论文|研究|工作))/gi,
  /受\s*([^\s，,]+?)的?启发/gi,
  /inspired\s+by/gi,
  /基于\s*([^\s，,]+?(?:论文|研究|方法))/gi,
  /采用\s*([^\s，,]+?的?方法)/gi,
  /使用了?\s*([^\s，,]+?(?:论文|研究|工作)中的)/gi,
  /([\u4e00-\u9fa5]{2,})\s*(?:提出|指出|表明)\s*.{0,30}?(?:理论|方法|模型|框架)/gi,

  // 英文触发
  /\b(cited|in\s+([\w\s]+?)\s+(?:paper|research|work|study|article))\b/gi,
  /\b(based\s+on\s+([\w\s]+?)\s+(?:paper|research|work|study))\b/gi,
  /\b(inspired\s+by)\b/gi,
  /\b(adopted\s+([\w\s]+?)\s+(?:method|approach|framework|model))\b/gi,
  /\b(following\s+([\w\s]+?)\s+(?:paper|research|work))\b/gi,
  /\b(according\s+to\s+([\w\s]+?)\s+(?:paper|research|work))\b/gi,
];

// 引用标记词（用于确认意图）
const CONFIRMATION_WORDS = [
  '引用', 'cited', 'citation', 'reference',
  '根据', '基于', '来自',
  '启发', 'inspired', 'based on',
  '采用', '使用', 'adopted', 'using',
];

export interface CitationIntent {
  hasIntent: boolean;
  confidence: number; // 0-1
  matchedText: string;
  matchedPattern: string;
  extractedReference?: string;
}

export interface DetectionResult {
  hasCitation: boolean;
  intents: CitationIntent[];
  overallConfidence: number;
}

/**
 * 检测文本中的引用意图
 */
export function detectCitationIntent(text: string): DetectionResult {
  const intents: CitationIntent[] = [];
  const normalizedText = text.toLowerCase();

  // 检查确认词
  const confirmationCount = CONFIRMATION_WORDS.filter(word =>
    normalizedText.includes(word.toLowerCase())
  ).length;

  // 如果没有确认词，基本没有引用意图
  if (confirmationCount === 0) {
    return {
      hasCitation: false,
      intents: [],
      overallConfidence: 0,
    };
  }

  // 基础置信度
  let baseConfidence = Math.min(confirmationCount * 0.2, 0.8);

  // 匹配模式
  for (const pattern of CITATION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    const matches = text.match(regex);

    if (matches) {
      for (const match of matches) {
        intents.push({
          hasIntent: true,
          confidence: baseConfidence,
          matchedText: match,
          matchedPattern: pattern.source,
        });
      }
    }
  }

  // 去重
  const uniqueIntents = intents.filter((item, index, self) =>
    index === self.findIndex(t => t.matchedText === item.matchedText)
  );

  // 计算整体置信度
  const overallConfidence = uniqueIntents.length > 0
    ? Math.min(baseConfidence + uniqueIntents.length * 0.1, 1.0)
    : baseConfidence;

  return {
    hasCitation: uniqueIntents.length > 0 || confirmationCount >= 2,
    intents: uniqueIntents,
    overallConfidence,
  };
}

/**
 * 从文本中提取可能的论文标题或引用
 */
export function extractPotentialCitations(text: string): string[] {
  const citations: string[] = [];

  // 提取 [标题] 格式
  const bracketMatches = text.match(/[\[【]([^\]】]{5,})[\]】]/g);
  if (bracketMatches) {
    citations.push(...bracketMatches);
  }

  // 提取 "论文名" 格式
  const quoteMatches = text.match(/"([^"]{5,})"/g);
  if (quoteMatches) {
    citations.push(...quoteMatches);
  }

  // 提取 DOI 格式
  const doiMatches = text.match(/10\.\d+\/[^\s，,。；]+/g);
  if (doiMatches) {
    citations.push(...doiMatches);
  }

  return Array.from(new Set(citations));
}

/**
 * 判断文本是否需要触发引用审核
 */
export function shouldTriggerVerification(text: string): boolean {
  const result = detectCitationIntent(text);
  return result.hasCitation && result.overallConfidence >= 0.4;
}

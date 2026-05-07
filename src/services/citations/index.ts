import prisma from '@/lib/db/prisma';
import { shouldTriggerVerification, detectCitationIntent } from '@/lib/ai/citation-detector';

export interface ProcessCommentResult {
  hasCitationIntent: boolean;
  triggeredVerification: boolean;
  citationId?: string;
}

/**
 * 处理评论/帖子中的引用意图检测
 * 如果检测到引用意图，自动创建待审核的 citation 记录
 */
export async function processCitationIntent(params: {
  userId: string;
  content: string;
  postId?: string;
  commentId?: string;
  publicationId?: string;
}): Promise<ProcessCommentResult> {
  const { userId, content, postId, commentId } = params;

  // 1. 检测引用意图
  const detection = detectCitationIntent(content);

  if (!shouldTriggerVerification(content)) {
    return {
      hasCitationIntent: false,
      triggeredVerification: false,
    };
  }

  // 2. 查找被引用的论文
  // 从内容中尝试提取论文引用
  const potentialCitations = await findPotentialCitations(content);

  if (potentialCitations.length === 0) {
    // 没有找到可关联的论文，但仍然记录意图（可能需要用户手动选择）
    return {
      hasCitationIntent: true,
      triggeredVerification: false,
    };
  }

  // 3. 为每个找到的论文创建 citation 记录
  const results = [];
  for (const pub of potentialCitations) {
    // 检查是否已存在相同的 pending citation
    const existing = await prisma.communityCitation.findFirst({
      where: {
        citingUserId: userId,
        publicationId: pub.id,
        status: 'PENDING',
        OR: [
          { citingPostId: postId || undefined },
          { citingCommentId: commentId || undefined },
        ],
      },
    });

    if (existing) {
      results.push({ citationId: existing.id });
      continue;
    }

    const citation = await prisma.communityCitation.create({
      data: {
        citingUserId: userId,
        citingPostId: postId,
        citingCommentId: commentId,
        publicationId: pub.id,
        groupId: pub.groupId,
        context: extractCitationContext(content),
        status: 'PENDING',
      },
    });

    results.push({ citationId: citation.id });
  }

  return {
    hasCitationIntent: true,
    triggeredVerification: results.length > 0,
    citationId: results[0]?.citationId,
  };
}

/**
 * 根据内容查找可能的论文引用
 */
async function findPotentialCitations(content: string) {
  // 提取 DOI
  const doiMatch = content.match(/10\.\d+\/[^\s，,。；]+/);
  if (doiMatch) {
    const pub = await prisma.publication.findFirst({
      where: { doi: doiMatch[0] },
    });
    if (pub) return [pub];
  }

  // 提取方括号中的内容作为论文标题搜索
  const bracketMatches = content.match(/[\[【]([^\]】]{5,})[\]】]/g);
  if (bracketMatches) {
    for (const match of bracketMatches) {
      const title = match.replace(/[\[【\]]/g, '');
      const pubs = await prisma.publication.findMany({
        where: {
          OR: [
            { title: { contains: title, mode: 'insensitive' } },
            { abstract: { contains: title, mode: 'insensitive' } },
          ],
        },
        take: 1,
      });
      if (pubs.length > 0) return pubs;
    }
  }

  // 如果没找到，返回空
  return [];
}

/**
 * 从内容中提取引用说明上下文
 */
function extractCitationContext(content: string): string | null {
  // 提取引用意图相关的句子
  const sentences = content.split(/[。！？\n]/);

  for (const sentence of sentences) {
    if (shouldTriggerVerification(sentence)) {
      return sentence.trim().slice(0, 500);
    }
  }

  // 返回第一句有意义的
  return content.slice(0, 200);
}

/**
 * 批量触发审核（供定时任务调用）
 */
export async function batchTriggerVerification(limit = 50) {
  const pendingCitations = await prisma.communityCitation.findMany({
    where: { status: 'PENDING' },
    select: { id: true },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  const results = [];
  for (const citation of pendingCitations) {
    // 调用审核 API
    try {
      const res = await fetch(process.env.NEXTAUTH_URL + '/api/v1/citations/agent-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citationId: citation.id }),
      });
      const data = await res.json();
      results.push({ citationId: citation.id, success: data.success });
    } catch (error) {
      results.push({ citationId: citation.id, success: false, error });
    }
  }

  return results;
}

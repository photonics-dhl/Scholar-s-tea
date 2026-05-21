import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// Proxy support for server-side fetch (Next.js App Router safe)
// Node.js 20 native fetch uses undici under the hood; use undici ProxyAgent.
let _dispatcher: any = undefined;
let _proxyInitPromise: Promise<void> | null = null;

async function initProxy(): Promise<void> {
  if (_proxyInitPromise) return _proxyInitPromise;
  _proxyInitPromise = (async () => {
    if (typeof window !== 'undefined') return;
    const proxyUrl =
      process.env.http_proxy ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.HTTPS_PROXY;
    if (!proxyUrl) return;
    try {
      const { ProxyAgent } = await import('undici');
      _dispatcher = new ProxyAgent(proxyUrl);
      console.log('[Embedding] Proxy initialized (undici):', proxyUrl);
    } catch (e) {
      console.warn('[Embedding] Proxy init failed, using native fetch:', e);
    }
  })();
  return _proxyInitPromise;
}

interface EmbeddingResult {
  embedding: number[];
  error?: string;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  source?: string | null;
  discipline?: string | null;
  similarity: number;
  metadata?: Record<string, unknown> | null;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  await initProxy();
  // ZCHAT supports OpenAI-compatible embeddings API, prioritize it
  const apiKey = process.env.ZCHAT_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY;
  const baseUrl = process.env.ZCHAT_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.MINIMAX_BASE_URL;

  if (!apiKey) {
    return { embedding: [], error: 'API key not configured' };
  }

  try {
    const fetchOpts: RequestInit & { dispatcher?: any } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
      }),
    };
    if (_dispatcher) {
      fetchOpts.dispatcher = _dispatcher;
    }
    const response = await fetch(`${baseUrl}/embeddings`, fetchOpts);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Embedding] API error:', response.status, errorText.slice(0, 200));
      return { embedding: [], error: `Embedding API error: ${response.status}` };
    }

    const data = await response.json();
    // Support multiple response formats: OpenAI {data:[{embedding}]}, ZCHAT {vectors:[...]}
    let embedding: number[] = [];
    if (Array.isArray(data.data) && data.data[0]?.embedding) {
      embedding = data.data[0].embedding;
    } else if (Array.isArray(data.vectors) && data.vectors.length > 0) {
      embedding = data.vectors[0];
    } else if (Array.isArray(data.embedding)) {
      embedding = data.embedding;
    }
    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.warn('[Embedding] Empty embedding returned. Response keys:', Object.keys(data).join(','));
    }
    return { embedding: Array.isArray(embedding) ? embedding : [] };
  } catch (error) {
    console.error('[Embedding] Generation error:', error instanceof Error ? error.message : error);
    return { embedding: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchKnowledgeBase(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    discipline?: string;
    type?: string;
  } = {}
): Promise<{ results: SearchResult[]; error?: string }> {
  const { limit = 5, threshold = 0.5, discipline, type } = options;

  try {
    const { embedding, error } = await generateEmbedding(query);
    const hasEmbedding = !error && embedding.length > 0;

    const whereClause: Prisma.KnowledgeDocumentWhereInput = {};
    if (discipline) {
      whereClause.discipline = discipline;
    }
    if (type) {
      whereClause.source = type;
    }

    // Fallback: keyword search when embeddings unavailable
    if (!hasEmbedding) {
      const keywords = query.split(/\s+/).filter((w) => w.length > 1);
      const orConditions =
        keywords.length > 0
          ? keywords.flatMap((k) => [
              { title: { contains: k, mode: 'insensitive' as const } },
              { content: { contains: k, mode: 'insensitive' as const } },
            ])
          : [
              { title: { contains: query, mode: 'insensitive' as const } },
              { content: { contains: query, mode: 'insensitive' as const } },
            ];
      const docs = await prisma.knowledgeDocument.findMany({
        where: {
          ...whereClause,
          OR: orConditions,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          source: true,
          discipline: true,
          metadata: true,
        },
      });
      return {
        results: docs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          source: doc.source,
          discipline: doc.discipline,
          similarity: 0.5,
          metadata: doc.metadata as Record<string, unknown> | null,
        })),
        error: error || undefined,
      };
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        source: true,
        discipline: true,
        metadata: true,
        embedding: true,
      },
    });

    const validResults: SearchResult[] = [];

    for (const doc of documents) {
      const emb = typeof doc.embedding === 'string' ? JSON.parse(doc.embedding) : doc.embedding;
      if (!emb || !Array.isArray(emb)) continue;

      const similarity = cosineSimilarity(embedding, emb);
      if (similarity >= threshold) {
        validResults.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          source: doc.source,
          discipline: doc.discipline,
          similarity,
          metadata: doc.metadata as Record<string, unknown> | null,
        });
      }
    }

    validResults.sort((a, b) => b.similarity - a.similarity);

    return { results: validResults.slice(0, limit) };
  } catch (error) {
    console.error('Knowledge base search error:', error);
    return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function addToKnowledgeBase(params: {
  title: string;
  content: string;
  source?: string;
  sourceId?: string;
  discipline?: string;
  authorId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id?: string; error?: string }> {
  try {
    const { embedding, error } = await generateEmbedding(
      `${params.title} ${params.content}`
    );

    if (error) {
      console.warn('[addToKB] Embedding failed, creating without embedding:', error);
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: params.title,
        content: params.content,
        source: params.source,
        sourceId: params.sourceId,
        discipline: params.discipline,
        authorId: params.authorId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : '[]',
      },
    });

    return { id: doc.id };
  } catch (error) {
    console.error('Add to knowledge base error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Upsert a document into the knowledge base by source + sourceId.
 * Used for syncing community content (posts, publications) into RAG.
 */
export async function upsertToKnowledgeBase(params: {
  title: string;
  content: string;
  source: string;
  sourceId: string;
  discipline?: string;
  authorId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id?: string; error?: string }> {
  try {
    const existing = await prisma.knowledgeDocument.findFirst({
      where: { source: params.source, sourceId: params.sourceId },
      select: { id: true },
    });

    const { embedding, error } = await generateEmbedding(
      `${params.title} ${params.content}`
    );

    if (error) {
      console.warn('[upsertToKB] Embedding failed, saving without embedding:', error);
    }

    const embeddingData = embedding.length > 0 ? JSON.stringify(embedding) : null;

    if (existing) {
      const doc = await prisma.knowledgeDocument.update({
        where: { id: existing.id },
        data: {
          title: params.title,
          content: params.content,
          discipline: params.discipline,
          authorId: params.authorId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          embedding: embeddingData,
        },
      });
      return { id: doc.id };
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: params.title,
        content: params.content,
        source: params.source,
        sourceId: params.sourceId,
        discipline: params.discipline,
        authorId: params.authorId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        embedding: embeddingData,
      },
    });

    return { id: doc.id };
  } catch (error) {
    console.error('Upsert to knowledge base error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Sync a Post into the knowledge base for RAG retrieval.
 * Fire-and-forget: call after post creation/update, do not await in hot path.
 */
export async function syncPostToKnowledgeBase(postId: string): Promise<void> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true } },
        discipline: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });

    if (!post) {
      console.warn('[syncPostToKB] Post not found:', postId);
      return;
    }

    const result = await upsertToKnowledgeBase({
      title: post.title,
      content: post.content,
      source: 'post',
      sourceId: post.id,
      discipline: post.discipline?.name || undefined,
      authorId: post.authorId,
      metadata: {
        authorName: post.author.name,
        tags: post.tags.map((t) => t.tag.name),
        createdAt: post.createdAt.toISOString(),
      },
    });

    if (result.error) {
      console.error('[syncPostToKB] Failed to sync post:', postId, result.error);
    } else {
      console.log('[syncPostToKB] Synced post:', postId, 'doc:', result.id);
    }
  } catch (err) {
    console.error('[syncPostToKB] Failed to sync post:', postId, err);
  }
}

/**
 * Sync a Publication into the knowledge base for RAG retrieval.
 * Fire-and-forget: call after publication creation/update, do not await in hot path.
 */
export async function syncPublicationToKnowledgeBase(pubId: string): Promise<void> {
  try {
    const pub = await prisma.publication.findUnique({
      where: { id: pubId },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    if (!pub) {
      console.warn('[syncPubToKB] Publication not found:', pubId);
      return;
    }

    const content = [pub.title, pub.abstract || '']
      .concat(pub.authors.join(', '))
      .filter(Boolean)
      .join('\n');

    const result = await upsertToKnowledgeBase({
      title: pub.title,
      content,
      source: 'publication',
      sourceId: pub.id,
      authorId: pub.groupId,
      metadata: {
        authors: pub.authors,
        year: pub.year,
        doi: pub.doi,
        citationCount: pub.citationCount,
        groupName: pub.group.name,
      },
    });

    if (result.error) {
      console.error('[syncPubToKB] Failed to sync publication:', pubId, result.error);
    } else {
      console.log('[syncPubToKB] Synced publication:', pubId, 'doc:', result.id);
    }
  } catch (err) {
    console.error('[syncPubToKB] Failed to sync publication:', pubId, err);
  }
}

export async function saveResearchMemory(params: {
  type: 'IDEA' | 'PAPER_SUMMARY' | 'DISCUSSION' | 'QUESTION' | 'NOTES';
  title: string;
  content: string;
  summary?: string;
  discipline?: string;
  userId?: string;
  relatedPaper?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}): Promise<{ id?: string; error?: string }> {
  try {
    const { embedding, error } = await generateEmbedding(
      `${params.title} ${params.content}`
    );

    if (error) {
      console.warn('[saveResearchMemory] Embedding failed, saving without embedding:', error);
    }

    const memory = await prisma.researchMemory.create({
      data: {
        type: params.type,
        title: params.title,
        content: params.content,
        summary: params.summary,
        discipline: params.discipline,
        userId: params.userId,
        relatedPaper: params.relatedPaper,
        tags: params.tags || [],
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : '[]',
      },
    });

    return { id: memory.id };
  } catch (error) {
    console.error('Save research memory error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function searchMemories(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    discipline?: string;
    userId?: string;
  } = {}
): Promise<{ results: SearchResult[]; error?: string }> {
  const { limit = 5, threshold = 0.5, discipline, userId } = options;

  try {
    const { embedding, error } = await generateEmbedding(query);
    const hasEmbedding = !error && embedding.length > 0;

    const whereClause: Prisma.ResearchMemoryWhereInput = {};
    if (discipline) {
      whereClause.discipline = discipline;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    if (!hasEmbedding) {
      const keywords = query.split(/\s+/).filter((w) => w.length > 1);
      const orConditions =
        keywords.length > 0
          ? keywords.flatMap((k) => [
              { title: { contains: k, mode: 'insensitive' as const } },
              { content: { contains: k, mode: 'insensitive' as const } },
            ])
          : [
              { title: { contains: query, mode: 'insensitive' as const } },
              { content: { contains: query, mode: 'insensitive' as const } },
            ];
      const memories = await prisma.researchMemory.findMany({
        where: {
          ...whereClause,
          OR: orConditions,
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          discipline: true,
          type: true,
          metadata: true,
        },
      });
      return {
        results: memories.map((mem) => ({
          id: mem.id,
          title: mem.title,
          content: mem.content,
          source: mem.type,
          discipline: mem.discipline,
          similarity: 0.5,
          metadata: mem.metadata as Record<string, unknown> | null,
        })),
        error: error || undefined,
      };
    }

    const memories = await prisma.researchMemory.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        discipline: true,
        type: true,
        metadata: true,
        embedding: true,
      },
    });

    const validResults: SearchResult[] = [];

    for (const mem of memories) {
      const emb = typeof mem.embedding === 'string' ? JSON.parse(mem.embedding) : mem.embedding;
      if (!emb || !Array.isArray(emb)) continue;

      const similarity = cosineSimilarity(embedding, emb);
      if (similarity >= threshold) {
        validResults.push({
          id: mem.id,
          title: mem.title,
          content: mem.content,
          source: mem.type,
          discipline: mem.discipline,
          similarity,
          metadata: mem.metadata as Record<string, unknown> | null,
        });
      }
    }

    validResults.sort((a, b) => b.similarity - a.similarity);

    return { results: validResults.slice(0, limit) };
  } catch (error) {
    console.error('Memory search error:', error);
    return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Search community content (posts, publications, comments) by keyword.
 * Fallback when embeddings are unavailable.
 */
export async function searchCommunityContent(
  query: string,
  options: {
    limit?: number;
    type?: 'post' | 'publication' | 'comment';
  } = {}
): Promise<{ results: SearchResult[]; error?: string }> {
  const { limit = 5, type } = options;
  const keywords = query.split(/\s+/).filter((w) => w.length > 1);

  const buildOrConditions = (fields: string[]) =>
    keywords.length > 0
      ? keywords.flatMap((k) => fields.map((f) => ({ [f]: { contains: k, mode: 'insensitive' as const } })))
      : [{ title: { contains: query, mode: 'insensitive' as const } }, { content: { contains: query, mode: 'insensitive' as const } }];

  try {
    const results: SearchResult[] = [];

    if (!type || type === 'post') {
      const posts = await prisma.post.findMany({
        where: { OR: buildOrConditions(['title', 'content']) },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      });
      for (const p of posts) {
        results.push({
          id: p.id,
          title: p.title,
          content: p.content,
          source: 'post',
          similarity: 0.5,
          metadata: { authorName: p.author.name, createdAt: p.createdAt.toISOString() },
        });
      }
    }

    if (!type || type === 'publication') {
      const pubs = await prisma.publication.findMany({
        where: { OR: buildOrConditions(['title', 'abstract']) },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          abstract: true,
          authors: true,
          year: true,
          createdAt: true,
        },
      });
      for (const p of pubs) {
        results.push({
          id: p.id,
          title: p.title,
          content: p.abstract || p.title,
          source: 'publication',
          similarity: 0.5,
          metadata: { authors: p.authors, year: p.year },
        });
      }
    }

    if (!type || type === 'comment') {
      const comments = await prisma.comment.findMany({
        where: { OR: buildOrConditions(['content']) },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { name: true } },
          post: { select: { title: true } },
        },
      });
      for (const c of comments) {
        results.push({
          id: c.id,
          title: `评论: ${c.post?.title || '未知帖子'}`,
          content: c.content,
          source: 'comment',
          similarity: 0.5,
          metadata: { authorName: c.author.name, createdAt: c.createdAt.toISOString() },
        });
      }
    }

    return { results };
  } catch (error) {
    console.error('Community content search error:', error);
    return { results: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getContextForQuery(
  query: string,
  maxTokens: number = 4000
): Promise<{ context: string; sources: SearchResult[] }> {
  const [kbRes, commRes, memRes] = await Promise.all([
    searchKnowledgeBase(query, { limit: 3 }),
    searchCommunityContent(query, { limit: 3 }),
    searchMemories(query, { limit: 2 }),
  ]);

  const allSources = [
    ...(kbRes.results || []),
    ...(commRes.results || []),
    ...(memRes.results || []),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const uniqueSources: SearchResult[] = [];
  for (const s of allSources) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      uniqueSources.push(s);
    }
  }

  // Sort by similarity desc, fallback sources at 0.5
  uniqueSources.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

  // Truncate by token estimate (1 token ≈ 4 chars for CJK, 4 chars ≈ 1 token for EN)
  const approxTokens = (text: string) => Math.ceil(text.length / 4);
  let usedTokens = 0;
  const selected: SearchResult[] = [];
  for (const s of uniqueSources) {
    const tokens = approxTokens(s.title) + approxTokens(s.content.slice(0, 1000));
    if (usedTokens + tokens > maxTokens) break;
    usedTokens += tokens;
    selected.push(s);
  }

  const context = selected
    .map((r) => `【${r.source || '知识'}】${r.title}\n${r.content.slice(0, 1000)}`)
    .join('\n\n---\n\n');

  return { context, sources: selected };
}

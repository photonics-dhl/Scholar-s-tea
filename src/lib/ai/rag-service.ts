import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

// Proxy support for server-side fetch
let _fetch: typeof fetch = fetch;
let _agent: any = undefined;
if (typeof window === 'undefined') {
  const proxyUrl = process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (proxyUrl) {
    try {
      const nodeFetch = require('node-fetch');
      const { HttpsProxyAgent } = require('https-proxy-agent');
      _fetch = nodeFetch.default || nodeFetch;
      _agent = new HttpsProxyAgent(proxyUrl);
    } catch {
      // Fallback to native fetch
    }
  }
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
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || process.env.ZCHAT_API_KEY;
  const baseUrl = process.env.MINIMAX_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.ZCHAT_BASE_URL;

  if (!apiKey) {
    return { embedding: [], error: 'API key not configured' };
  }

  try {
    const response = await _fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
      }),
      agent: _agent,
    } as any);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Embedding API error:', response.status, errorText);
      return { embedding: [], error: `Embedding API error: ${response.status}` };
    }

    const data = await response.json();
    return { embedding: data.data?.[0]?.embedding || [] };
  } catch (error) {
    console.error('Embedding generation error:', error);
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
  const { limit = 5, threshold = 0.7, discipline } = options;

  try {
    const { embedding, error } = await generateEmbedding(query);
    if (error || embedding.length === 0) {
      return { results: [], error };
    }

    const whereClause: Prisma.KnowledgeDocumentWhereInput = {};
    if (discipline) {
      whereClause.discipline = discipline;
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

    if (error || embedding.length === 0) {
      return { error };
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        title: params.title,
        content: params.content,
        source: params.source,
        sourceId: params.sourceId,
        discipline: params.discipline,
        authorId: params.authorId,
        metadata: params.metadata as unknown as string | undefined,
        embedding: JSON.stringify(embedding),
      },
    });

    return { id: doc.id };
  } catch (error) {
    console.error('Add to knowledge base error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
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

    if (error || embedding.length === 0) {
      return { error };
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
        metadata: params.metadata as unknown as string | undefined,
        embedding: JSON.stringify(embedding),
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
  const { limit = 5, threshold = 0.7, discipline, userId } = options;

  try {
    const { embedding, error } = await generateEmbedding(query);
    if (error || embedding.length === 0) {
      return { results: [], error };
    }

    const whereClause: Prisma.ResearchMemoryWhereInput = {};
    if (discipline) {
      whereClause.discipline = discipline;
    }
    if (userId) {
      whereClause.userId = userId;
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

export async function getContextForQuery(
  query: string,
  maxTokens: number = 4000
): Promise<{ context: string; sources: SearchResult[] }> {
  const { results, error } = await searchKnowledgeBase(query, { limit: 3 });

  if (error || results.length === 0) {
    return { context: '', sources: [] };
  }

  const context = results
    .map((r) => `【${r.title}】\n${r.content.slice(0, 1000)}`)
    .join('\n\n');

  return { context, sources: results };
}

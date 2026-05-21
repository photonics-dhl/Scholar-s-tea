import { describe, it, expect } from 'vitest'
import { parsePeerReviewJson, PEER_REVIEW_DIMENSIONS } from './peer-review-prompts'

describe('parsePeerReviewJson', () => {
  const validPayload = {
    summary: 'This paper presents a novel approach.',
    scores: {
      novelty: { score: 8, comment: 'Strong novelty' },
      methodology: { score: 7, comment: 'Good methods' },
      soundness: { score: 9, comment: 'Solid results' },
      writing: { score: 6, comment: 'A bit dense' },
      references: { score: 7, comment: 'Well cited' },
      reproducibility: { score: 8, comment: 'Code available' },
      impact: { score: 10, comment: 'High impact' },
    },
    overallComment: 'Overall a strong submission.',
    verdict: 'minor_revision',
    suggestions: [
      { priority: 'P0', description: 'Clarify methodology', location: 'Section 3' },
      { priority: 'P1', description: 'Add more experiments' },
    ],
  }

  it('parses valid JSON string correctly', () => {
    const result = parsePeerReviewJson(JSON.stringify(validPayload))
    expect(result).not.toBeNull()
    expect(result!.summary).toBe('This paper presents a novel approach.')
    expect(result!.verdict).toBe('minor_revision')
    expect(result!.suggestions).toHaveLength(2)
    expect(result!.suggestions[0].priority).toBe('P0')
  })

  it('parses JSON wrapped in markdown code block', () => {
    const wrapped = '```json\n' + JSON.stringify(validPayload) + '\n```'
    const result = parsePeerReviewJson(wrapped)
    expect(result).not.toBeNull()
    expect(result!.verdict).toBe('minor_revision')
  })

  it('normalizes invalid scores to range 1-10', () => {
    const payload = {
      ...validPayload,
      scores: {
        novelty: { score: 15, comment: '' },
        methodology: { score: -3, comment: '' },
        soundness: { score: 5.7, comment: '' },
        writing: { score: 'bad', comment: '' },
        references: { score: null, comment: '' },
        reproducibility: { score: undefined, comment: '' },
        impact: { score: 8, comment: '' },
      },
    }
    const result = parsePeerReviewJson(JSON.stringify(payload))
    expect(result).not.toBeNull()
    expect(result!.scores.novelty.score).toBe(10) // 15 clamped to 10
    expect(result!.scores.methodology.score).toBe(1) // -3 clamped to 1
    expect(result!.scores.soundness.score).toBe(6) // 5.7 rounded
    expect(result!.scores.writing.score).toBe(5) // 'bad' => NaN => fallback 5
    expect(result!.scores.references.score).toBe(5) // null => 0 => fallback 5
    expect(result!.scores.reproducibility.score).toBe(5) // undefined => fallback 5
    expect(result!.scores.impact.score).toBe(8)
  })

  it('normalizes invalid verdict to minor_revision', () => {
    const payload = { ...validPayload, verdict: 'maybe' }
    const result = parsePeerReviewJson(JSON.stringify(payload))
    expect(result!.verdict).toBe('minor_revision')
  })

  it('normalizes invalid suggestion priority to P2', () => {
    const payload = {
      ...validPayload,
      suggestions: [{ priority: 'URGENT', description: 'Fix this' }],
    }
    const result = parsePeerReviewJson(JSON.stringify(payload))
    expect(result!.suggestions[0].priority).toBe('P2')
  })

  it('handles overall_comment snake_case fallback', () => {
    const payload = {
      ...validPayload,
      overallComment: undefined,
      overall_comment: 'Fallback comment',
    }
    const result = parsePeerReviewJson(JSON.stringify(payload))
    expect(result!.overallComment).toBe('Fallback comment')
  })

  it('returns null for missing required fields', () => {
    expect(parsePeerReviewJson('{}')).toBeNull()
    expect(parsePeerReviewJson('{"summary": "only summary"}')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parsePeerReviewJson('not json at all')).toBeNull()
    expect(parsePeerReviewJson('{"broken')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parsePeerReviewJson('')).toBeNull()
  })
})

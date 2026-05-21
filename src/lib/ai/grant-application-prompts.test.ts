import { describe, it, expect } from 'vitest'
import { parseGrantApplicationJson } from './grant-application-prompts'

describe('parseGrantApplicationJson', () => {
  const validPayload = {
    title: 'Novel Optics Research',
    sections: {
      background: {
        content: 'Background text',
        keyPoints: ['Point 1', 'Point 2'],
      },
      researchContent: {
        content: 'Research content text',
        objectives: ['Obj 1', 'Obj 2'],
      },
      innovation: {
        content: 'Innovation content',
        points: [
          { type: '原始创新', content: 'C1', support: 'S1', effect: 'E1' },
        ],
      },
      feasibility: {
        content: 'Feasibility content',
        analysis: 'Analysis text',
      },
      expectedOutcomes: {
        content: 'Outcomes content',
        metrics: [{ type: '论文', description: 'Publish 3 papers', quantity: '3' }],
      },
    },
    budget: {
      total: '100万',
      breakdown: [{ category: '设备', amount: '50万', justification: 'Need lasers' }],
    },
    timeline: {
      phases: [
        { phase: '第一阶段', tasks: ['Task 1'], milestones: ['Milestone 1'] },
      ],
    },
    references: ['Ref 1', 'Ref 2'],
  }

  it('parses valid JSON correctly', () => {
    const result = parseGrantApplicationJson(JSON.stringify(validPayload))
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Novel Optics Research')
    expect(result!.sections.background.content).toBe('Background text')
    expect(result!.sections.background.keyPoints).toEqual(['Point 1', 'Point 2'])
    expect(result!.budget.total).toBe('100万')
    expect(result!.timeline.phases).toHaveLength(1)
    expect(result!.references).toEqual(['Ref 1', 'Ref 2'])
  })

  it('parses JSON wrapped in markdown code block', () => {
    const wrapped = '```json\n' + JSON.stringify(validPayload) + '\n```'
    const result = parseGrantApplicationJson(wrapped)
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Novel Optics Research')
  })

  it('normalizes invalid innovation type to 集成创新', () => {
    const payload = {
      ...validPayload,
      sections: {
        ...validPayload.sections,
        innovation: {
          content: 'Innovation',
          points: [{ type: 'UnknownType', content: 'C', support: 'S', effect: 'E' }],
        },
      },
    }
    const result = parseGrantApplicationJson(JSON.stringify(payload))
    expect(result!.sections.innovation.points[0].type).toBe('集成创新')
  })

  it('handles snake_case fallback for research_content', () => {
    const payload = {
      ...validPayload,
      sections: {
        ...validPayload.sections,
        research_content: {
          content: 'Snake case content',
          objectives: ['Obj A'],
        },
        researchContent: undefined,
      },
    }
    const result = parseGrantApplicationJson(JSON.stringify(payload))
    expect(result!.sections.researchContent.content).toBe('Snake case content')
    expect(result!.sections.researchContent.objectives).toEqual(['Obj A'])
  })

  it('handles snake_case fallback for expected_outcomes', () => {
    const payload = {
      ...validPayload,
      sections: {
        ...validPayload.sections,
        expected_outcomes: {
          content: 'Snake outcomes',
          metrics: [],
        },
        expectedOutcomes: undefined,
      },
    }
    const result = parseGrantApplicationJson(JSON.stringify(payload))
    expect(result!.sections.expectedOutcomes.content).toBe('Snake outcomes')
  })

  it('returns null for missing required fields', () => {
    expect(parseGrantApplicationJson('{}')).toBeNull()
    expect(parseGrantApplicationJson('{"title": "Only title"}')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseGrantApplicationJson('not json')).toBeNull()
    expect(parseGrantApplicationJson('{"broken')).toBeNull()
  })

  it('gracefully handles empty arrays and objects', () => {
    const minimal = {
      title: 'Minimal',
      sections: {
        background: { content: '', keyPoints: [] },
        researchContent: { content: '', objectives: [] },
        innovation: { content: '', points: [] },
        feasibility: { content: '', analysis: '' },
        expectedOutcomes: { content: '', metrics: [] },
      },
      budget: { total: '', breakdown: [] },
      timeline: { phases: [] },
      references: [],
    }
    const result = parseGrantApplicationJson(JSON.stringify(minimal))
    expect(result).not.toBeNull()
    expect(result!.sections.innovation.points).toEqual([])
    expect(result!.budget.breakdown).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import { convertLatexToUtf8, processMathInMarkdown, stripLatexDelimiters } from './latex-to-utf8'

describe('convertLatexToUtf8', () => {
  it('converts Greek letters', () => {
    expect(convertLatexToUtf8('\\alpha + \\beta')).toBe('α + β')
    expect(convertLatexToUtf8('\\Gamma(x)')).toBe('Γ(x)')
    expect(convertLatexToUtf8('\\Delta E')).toBe('Δ E')
  })

  it('converts math symbols', () => {
    expect(convertLatexToUtf8('\\infty')).toBe('∞')
    expect(convertLatexToUtf8('\\sum_{i=1}^{n}')).toBe('Σᵢ₌₁ⁿ')
    expect(convertLatexToUtf8('\\leq \\geq \\neq')).toBe('≤ ≥ ≠')
  })

  it('converts fractions', () => {
    expect(convertLatexToUtf8('\\frac{a}{b}')).toBe('a/b')
    expect(convertLatexToUtf8('\\frac{x+1}{y-2}')).toBe('(x+1)/(y-2)')
  })

  it('converts subscripts and superscripts', () => {
    expect(convertLatexToUtf8('x^2')).toBe('x²')
    expect(convertLatexToUtf8('x_i')).toBe('xᵢ')
    expect(convertLatexToUtf8('E=mc^2')).toBe('E=mc²')
  })

  it('converts font commands', () => {
    expect(convertLatexToUtf8('\\mathbb{R}')).toBe('ℝ')
    expect(convertLatexToUtf8('\\mathcal{L}')).toBe('ℒ')
  })

  it('converts function names', () => {
    expect(convertLatexToUtf8('\\sin(x) + \\cos(y)')).toBe('sin(x) + cos(y)')
    expect(convertLatexToUtf8('\\arg\\min_x')).toBe('argminₓ')
  })

  it('handles matrices', () => {
    expect(convertLatexToUtf8('\\begin{bmatrix}1 & 2 \\\\ 3 & 4\\end{bmatrix}')).toBe('[ 1 & 2 3 & 4 ]')
  })

  it('returns empty string for empty input', () => {
    expect(convertLatexToUtf8('')).toBe('')
  })
})

describe('processMathInMarkdown', () => {
  it('converts inline math $...$', () => {
    const result = processMathInMarkdown('Energy $E=mc^2$ is famous.')
    expect(result.hasMath).toBe(true)
    expect(result.text).toContain('E=mc²')
    expect(result.text).toContain('<span class="math-inline">')
  })

  it('converts display math $$...$$', () => {
    const result = processMathInMarkdown('$$\\sum_{i=1}^{n} x_i$$')
    expect(result.hasMath).toBe(true)
    expect(result.text).toContain('Σᵢ₌₁ⁿ')
    expect(result.text).toContain('<div class="math-display">')
  })

  it('returns hasMath=false when no math', () => {
    const result = processMathInMarkdown('Plain text without math.')
    expect(result.hasMath).toBe(false)
    expect(result.text).toBe('Plain text without math.')
  })
})

describe('stripLatexDelimiters', () => {
  it('removes inline delimiters', () => {
    expect(stripLatexDelimiters('Value is $x^2$ here')).toBe('Value is x^2 here')
  })

  it('removes display delimiters', () => {
    expect(stripLatexDelimiters('$$\\alpha + \\beta$$')).toBe('\\alpha + \\beta')
  })
})

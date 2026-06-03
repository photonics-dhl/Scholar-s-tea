/**
 * Knowledge Base Standardized Category System
 *
 * Two-level hierarchy: Discipline (primary) -> Sub-Discipline (secondary)
 * Both stored in metadata JSON to avoid schema changes.
 *
 * Design principles:
 * 1. Align with existing Discipline model (loosely coupled, no FK)
 * 2. Primary disciplines for broad categorization
 * 3. Sub-disciplines for academic specificity
 * 4. Tags for fine-grained labeling (methods, objects, applications)
 * 5. AI auto-inference uses this dictionary uniformly
 */

// ============================================
// Primary Disciplines (Level 1)
// ============================================

export interface DisciplineOption {
  value: string
  label: string
  labelEn: string
  icon?: string
  description?: string
}

export const KNOWLEDGE_DISCIPLINES: DisciplineOption[] = [
  { value: 'physics', label: 'Physics', labelEn: 'Physics', description: 'Theoretical, quantum, condensed matter, computational' },
  { value: 'optics', label: 'Optics', labelEn: 'Optics', description: 'Geometric, physical, quantum, nano, nonlinear, biophotonics' },
  { value: 'photonics', label: 'Photonics', labelEn: 'Photonics', description: 'Integrated, fiber, optoelectronic, quantum, topological' },
  { value: 'materials-science', label: 'Materials Science', labelEn: 'Materials Science', description: 'Nanomaterials, metamaterials, semiconductors, 2D materials' },
  { value: 'chemistry', label: 'Chemistry', labelEn: 'Chemistry', description: 'Physical, organic, computational, materials chemistry' },
  { value: 'biology', label: 'Biology', labelEn: 'Biology', description: 'Molecular, biophysics, synthetic, neuroscience, biomedical' },
  { value: 'computer-science', label: 'Computer Science', labelEn: 'Computer Science', description: 'Algorithms, systems, software engineering, networks' },
  { value: 'artificial-intelligence', label: 'Artificial Intelligence', labelEn: 'Artificial Intelligence', description: 'ML, deep learning, CV, NLP, reinforcement learning' },
  { value: 'mathematics', label: 'Mathematics', labelEn: 'Mathematics', description: 'Applied, computational, statistics, optimization' },
  { value: 'engineering', label: 'Engineering', labelEn: 'Engineering', description: 'Electronics, mechanical, energy, optical engineering' },
  { value: 'medicine', label: 'Medicine', labelEn: 'Medicine', description: 'Biomedical, clinical, medical imaging, drug discovery' },
  { value: 'economics', label: 'Economics', labelEn: 'Economics', description: 'Micro, macro, econometrics, financial engineering' },
  { value: 'social-sciences', label: 'Social Sciences', labelEn: 'Social Sciences', description: 'Sociology, psychology, education, academic writing' },
  { value: 'earth-sciences', label: 'Earth Sciences', labelEn: 'Earth Sciences', description: 'Geology, atmospheric, oceanography, environmental' },
  { value: 'interdisciplinary', label: 'Interdisciplinary', labelEn: 'Interdisciplinary', description: 'Multi-disciplinary fusion research' },
]

// Quick lookup map
const disciplineMap = new Map<string, DisciplineOption>()
for (const d of KNOWLEDGE_DISCIPLINES) {
  disciplineMap.set(d.value, d)
  disciplineMap.set(d.label, d)
  disciplineMap.set(d.label.toLowerCase(), d)
  disciplineMap.set(d.labelEn.toLowerCase(), d)
}

/** Get discipline info by value, label, or English name */
export function getDiscipline(valueOrLabel: string | null | undefined): DisciplineOption | undefined {
  if (!valueOrLabel) return undefined
  const normalized = valueOrLabel.trim().toLowerCase()
  const direct = disciplineMap.get(normalized)
  if (direct) return direct
  return KNOWLEDGE_DISCIPLINES.find(
    (d) => d.value === normalized || d.label === valueOrLabel || d.labelEn.toLowerCase() === normalized
  )
}

/** Normalize discipline input to standard value */
export function normalizeDiscipline(input: string | null | undefined): string | null {
  const d = getDiscipline(input)
  return d ? d.value : null
}

/** Get display label for a discipline value */
export function getDisciplineLabel(value: string | null | undefined): string | null {
  const d = getDiscipline(value)
  return d ? d.label : value || null
}

// ============================================
// Secondary Disciplines (Level 2)
// ============================================

export interface SubDisciplineOption {
  value: string
  label: string
  parent: string // parent discipline value
}

export const KNOWLEDGE_SUB_DISCIPLINES: SubDisciplineOption[] = [
  // Physics
  { value: 'theoretical-physics', label: 'Theoretical Physics', parent: 'physics' },
  { value: 'quantum-physics', label: 'Quantum Physics', parent: 'physics' },
  { value: 'condensed-matter', label: 'Condensed Matter', parent: 'physics' },
  { value: 'computational-physics', label: 'Computational Physics', parent: 'physics' },
  { value: 'atomic-molecular', label: 'Atomic & Molecular Physics', parent: 'physics' },
  // Optics
  { value: 'geometric-optics', label: 'Geometric Optics', parent: 'optics' },
  { value: 'physical-optics', label: 'Physical Optics', parent: 'optics' },
  { value: 'quantum-optics', label: 'Quantum Optics', parent: 'optics' },
  { value: 'nano-optics', label: 'Nano-Optics', parent: 'optics' },
  { value: 'nonlinear-optics', label: 'Nonlinear Optics', parent: 'optics' },
  { value: 'biomedical-optics', label: 'Biomedical Optics', parent: 'optics' },
  // Photonics
  { value: 'integrated-photonics', label: 'Integrated Photonics', parent: 'photonics' },
  { value: 'fiber-photonics', label: 'Fiber Photonics', parent: 'photonics' },
  { value: 'optoelectronics', label: 'Optoelectronic Devices', parent: 'photonics' },
  { value: 'quantum-photonics', label: 'Quantum Photonics', parent: 'photonics' },
  { value: 'topological-photonics', label: 'Topological Photonics', parent: 'photonics' },
  { value: 'optical-computing', label: 'Optical Computing', parent: 'photonics' },
  // Materials Science
  { value: 'nanomaterials', label: 'Nanomaterials', parent: 'materials-science' },
  { value: 'metamaterials', label: 'Metamaterials', parent: 'materials-science' },
  { value: 'semiconductors', label: 'Semiconductors', parent: 'materials-science' },
  { value: '2d-materials', label: '2D Materials', parent: 'materials-science' },
  { value: 'optoelectronic-materials', label: 'Optoelectronic Materials', parent: 'materials-science' },
  // Chemistry
  { value: 'physical-chemistry', label: 'Physical Chemistry', parent: 'chemistry' },
  { value: 'organic-chemistry', label: 'Organic Chemistry', parent: 'chemistry' },
  { value: 'computational-chemistry', label: 'Computational Chemistry', parent: 'chemistry' },
  { value: 'materials-chemistry', label: 'Materials Chemistry', parent: 'chemistry' },
  // Biology
  { value: 'molecular-biology', label: 'Molecular Biology', parent: 'biology' },
  { value: 'biophysics', label: 'Biophysics', parent: 'biology' },
  { value: 'synthetic-biology', label: 'Synthetic Biology', parent: 'biology' },
  { value: 'neuroscience', label: 'Neuroscience', parent: 'biology' },
  { value: 'biomedical-science', label: 'Biomedical Science', parent: 'biology' },
  // Computer Science
  { value: 'algorithms', label: 'Algorithms & Theory', parent: 'computer-science' },
  { value: 'systems', label: 'Systems Architecture', parent: 'computer-science' },
  { value: 'software-engineering', label: 'Software Engineering', parent: 'computer-science' },
  { value: 'networks', label: 'Computer Networks', parent: 'computer-science' },
  { value: 'databases', label: 'Database Systems', parent: 'computer-science' },
  // Artificial Intelligence
  { value: 'machine-learning', label: 'Machine Learning', parent: 'artificial-intelligence' },
  { value: 'deep-learning', label: 'Deep Learning', parent: 'artificial-intelligence' },
  { value: 'computer-vision', label: 'Computer Vision', parent: 'artificial-intelligence' },
  { value: 'nlp', label: 'Natural Language Processing', parent: 'artificial-intelligence' },
  { value: 'reinforcement-learning', label: 'Reinforcement Learning', parent: 'artificial-intelligence' },
  // Mathematics
  { value: 'applied-mathematics', label: 'Applied Mathematics', parent: 'mathematics' },
  { value: 'computational-mathematics', label: 'Computational Mathematics', parent: 'mathematics' },
  { value: 'statistics', label: 'Probability & Statistics', parent: 'mathematics' },
  { value: 'optimization', label: 'Optimization Theory', parent: 'mathematics' },
  // Engineering
  { value: 'electronic-engineering', label: 'Electronic Engineering', parent: 'engineering' },
  { value: 'mechanical-engineering', label: 'Mechanical Engineering', parent: 'engineering' },
  { value: 'energy-engineering', label: 'Energy Engineering', parent: 'engineering' },
  { value: 'optical-engineering', label: 'Optical Engineering', parent: 'engineering' },
  // Medicine
  { value: 'biomedical', label: 'Biomedical', parent: 'medicine' },
  { value: 'clinical-medicine', label: 'Clinical Medicine', parent: 'medicine' },
  { value: 'medical-imaging', label: 'Medical Imaging', parent: 'medicine' },
  { value: 'drug-discovery', label: 'Drug Discovery', parent: 'medicine' },
  // Economics
  { value: 'microeconomics', label: 'Microeconomics', parent: 'economics' },
  { value: 'macroeconomics', label: 'Macroeconomics', parent: 'economics' },
  { value: 'econometrics', label: 'Econometrics', parent: 'economics' },
  { value: 'financial-engineering', label: 'Financial Engineering', parent: 'economics' },
  // Social Sciences
  { value: 'sociology', label: 'Sociology', parent: 'social-sciences' },
  { value: 'psychology', label: 'Psychology', parent: 'social-sciences' },
  { value: 'education', label: 'Education', parent: 'social-sciences' },
  { value: 'academic-writing', label: 'Academic Writing', parent: 'social-sciences' },
  // Earth Sciences
  { value: 'geology', label: 'Geology', parent: 'earth-sciences' },
  { value: 'atmospheric', label: 'Atmospheric Science', parent: 'earth-sciences' },
  { value: 'oceanography', label: 'Oceanography', parent: 'earth-sciences' },
  { value: 'environmental', label: 'Environmental Science', parent: 'earth-sciences' },
  // Interdisciplinary
  { value: 'multi-disciplinary', label: 'Multi-disciplinary', parent: 'interdisciplinary' },
  { value: 'bioinformatics', label: 'Bioinformatics', parent: 'interdisciplinary' },
  { value: 'computational-physics', label: 'Computational Physics', parent: 'interdisciplinary' },
  { value: 'optoelectronic-integration', label: 'Optoelectronic Integration', parent: 'interdisciplinary' },
]

/** Group sub-disciplines by parent discipline */
export function getSubDisciplinesByParent(parentValue: string): SubDisciplineOption[] {
  return KNOWLEDGE_SUB_DISCIPLINES.filter((s) => s.parent === parentValue)
}

/** Get sub-discipline info by value */
export function getSubDiscipline(value: string | null | undefined): SubDisciplineOption | undefined {
  if (!value) return undefined
  return KNOWLEDGE_SUB_DISCIPLINES.find((s) => s.value === value)
}

/** Get display label for a sub-discipline value */
export function getSubDisciplineLabel(value: string | null | undefined): string | null {
  const s = getSubDiscipline(value)
  return s ? s.label : value || null
}

/** Validate that sub-discipline belongs to given discipline */
export function isValidSubDisciplineFor(disciplineValue: string, subDisciplineValue: string): boolean {
  const sub = getSubDiscipline(subDisciplineValue)
  return sub ? sub.parent === disciplineValue : false
}

// ============================================
// Tags System (Fine-grained)
// ============================================

export interface TagCategory {
  category: string
  tags: string[]
}

/** Preset tag categories */
export const KNOWLEDGE_TAG_CATEGORIES: TagCategory[] = [
  {
    category: 'Research Methods',
    tags: [
      'Theoretical Derivation', 'Numerical Simulation', 'Experimental Verification', 'Simulation Analysis',
      'First-principles', 'Finite Element', 'Monte Carlo', 'Molecular Dynamics',
      'ML-assisted', 'Data-driven', 'Multi-physics Coupling',
    ],
  },
  {
    category: 'Research Objects',
    tags: [
      'Metasurface', 'Photonic Crystal', 'Waveguide', 'Resonator',
      'Quantum Dot', 'Nanostructure', '2D Material', 'Topological Material',
      'Plasmonics', 'Nonlinear Optics', 'Metamaterial',
      'Optical Fiber', 'Laser', 'Detector', 'Modulator',
    ],
  },
  {
    category: 'Applications',
    tags: [
      'Optical Communication', 'Optical Computing', 'Optical Sensing', 'Optical Imaging',
      'Biomedical Optics', 'Quantum Information', 'Optical Storage',
      'Solar Energy', 'Display Technology', 'LiDAR', 'AR/VR',
    ],
  },
  {
    category: 'Core Concepts',
    tags: [
      'Polarization', 'Phase', 'Amplitude', 'Wavelength',
      'Diffraction', 'Interference', 'Scattering', 'Absorption',
      'Total Internal Reflection', 'Slow Light', 'Super-resolution', 'PT Symmetry',
    ],
  },
  {
    category: 'Paper Types',
    tags: [
      'Original Research', 'Review', 'Letter', 'Method Paper',
      'Theory Paper', 'Experiment Paper', 'Interdisciplinary Research',
    ],
  },
]

/** Flat list of all preset tags */
export const ALL_KNOWLEDGE_TAGS = KNOWLEDGE_TAG_CATEGORIES.flatMap((c) => c.tags)

/** Tag to category mapping */
const tagToCategoryMap = new Map<string, string>()
for (const cat of KNOWLEDGE_TAG_CATEGORIES) {
  for (const tag of cat.tags) {
    tagToCategoryMap.set(tag, cat.category)
  }
}

/** Get category of a tag */
export function getTagCategory(tag: string): string | null {
  return tagToCategoryMap.get(tag) || null
}

// ============================================
// Source Types
// ============================================

export const KNOWLEDGE_SOURCES = [
  { value: 'paper', label: 'Paper', icon: 'FileText' },
  { value: 'webpage', label: 'Webpage', icon: 'Globe' },
  { value: 'arxiv', label: 'arXiv Preprint', icon: 'FileText' },
  { value: 'semantic_scholar', label: 'Semantic Scholar', icon: 'BookOpen' },
  { value: 'tavily', label: 'Tavily Search', icon: 'Search' },
  { value: 'post', label: 'Community Post', icon: 'MessageSquare' },
  { value: 'news', label: 'News', icon: 'Newspaper' },
  { value: 'wiki', label: 'Wiki', icon: 'BookOpen' },
  { value: 'manual', label: 'Manual', icon: 'BookMarked' },
  { value: 'publication', label: 'Publication', icon: 'FileText' },
] as const

export type KnowledgeSource = (typeof KNOWLEDGE_SOURCES)[number]['value']

export function getSourceLabel(source: string | null): string {
  const found = KNOWLEDGE_SOURCES.find((s) => s.value === (source || ''))
  return found?.label || source || 'Document'
}

// ============================================
// AI Classification Prompt Helper
// ============================================

/** Build classification prompt for AI inference */
export function buildClassificationPrompt(): string {
  const disciplines = KNOWLEDGE_DISCIPLINES.map((d) => `${d.label}(${d.value})`).join(', ')
  const subDisciplines = KNOWLEDGE_SUB_DISCIPLINES.map((s) => `${s.label}(${s.value})[${s.parent}]`).join(', ')
  const tags = ALL_KNOWLEDGE_TAGS.slice(0, 30).join(', ')

  return `Infer the classification of this knowledge document.

【Primary Discipline】（choose one most matching）:
${disciplines}

【Secondary Discipline / Sub-field】（choose one most matching）:
${subDisciplines}

【Tags】（choose 2-5 most relevant）:
${tags}

Strictly use values from the lists above. Do not invent categories.
Output JSON format:
{
  "discipline": "discipline_value",
  "subDiscipline": "sub_discipline_value",
  "tags": ["Tag1", "Tag2"],
  "confidence": 0.85
}`
}

/** Extract classification from AI output */
export function extractClassificationFromAI(
  aiOutput: string
): { discipline: string | null; subDiscipline: string | null; tags: string[] } {
  try {
    const jsonMatch = aiOutput.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const discipline = normalizeDiscipline(parsed.discipline)
      const subDiscipline = parsed.subDiscipline && getSubDiscipline(parsed.subDiscipline)
        ? parsed.subDiscipline
        : null
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: string) => ALL_KNOWLEDGE_TAGS.includes(t))
        : []
      return { discipline, subDiscipline, tags }
    }
  } catch {
    // fallback to text matching
  }

  let discipline: string | null = null
  for (const d of KNOWLEDGE_DISCIPLINES) {
    if (aiOutput.includes(d.label) || aiOutput.includes(d.value)) {
      discipline = d.value
      break
    }
  }

  let subDiscipline: string | null = null
  for (const s of KNOWLEDGE_SUB_DISCIPLINES) {
    if (aiOutput.includes(s.label) || aiOutput.includes(s.value)) {
      subDiscipline = s.value
      break
    }
  }

  const tags: string[] = []
  for (const tag of ALL_KNOWLEDGE_TAGS) {
    if (aiOutput.includes(tag)) {
      tags.push(tag)
    }
  }

  return { discipline, subDiscipline, tags: tags.slice(0, 5) }
}

// ============================================
// Color Accents for UI (per discipline)
// ============================================

/**
 * Per-discipline visual styles for knowledge base zone grouping.
 * Each discipline gets a left color bar + solid icon bg for instant recognition.
 */

/** Left border color for the discipline zone (border-l-4) */
export const DISCIPLINE_ZONE_BORDERS: Record<string, string> = {
  physics: 'border-l-blue-500',
  optics: 'border-l-cyan-500',
  photonics: 'border-l-violet-500',
  'materials-science': 'border-l-amber-500',
  chemistry: 'border-l-emerald-500',
  biology: 'border-l-rose-500',
  'computer-science': 'border-l-sky-500',
  'artificial-intelligence': 'border-l-purple-500',
  mathematics: 'border-l-slate-500',
  engineering: 'border-l-orange-500',
  medicine: 'border-l-red-500',
  economics: 'border-l-yellow-500',
  'social-sciences': 'border-l-teal-500',
  'earth-sciences': 'border-l-green-500',
  interdisciplinary: 'border-l-indigo-500',
}

/** Header text color for the discipline title */
export const DISCIPLINE_HEADER_TEXTS: Record<string, string> = {
  physics: 'text-blue-700',
  optics: 'text-cyan-700',
  photonics: 'text-violet-700',
  'materials-science': 'text-amber-700',
  chemistry: 'text-emerald-700',
  biology: 'text-rose-700',
  'computer-science': 'text-sky-700',
  'artificial-intelligence': 'text-purple-700',
  mathematics: 'text-slate-700',
  engineering: 'text-orange-700',
  medicine: 'text-red-700',
  economics: 'text-yellow-700',
  'social-sciences': 'text-teal-700',
  'earth-sciences': 'text-green-700',
  interdisciplinary: 'text-indigo-700',
}

/** Solid icon background with white icon for strong visibility */
export const DISCIPLINE_ICON_BGS: Record<string, string> = {
  physics: 'bg-blue-500 text-white',
  optics: 'bg-cyan-500 text-white',
  photonics: 'bg-violet-500 text-white',
  'materials-science': 'bg-amber-500 text-white',
  chemistry: 'bg-emerald-500 text-white',
  biology: 'bg-rose-500 text-white',
  'computer-science': 'bg-sky-500 text-white',
  'artificial-intelligence': 'bg-purple-500 text-white',
  mathematics: 'bg-slate-500 text-white',
  engineering: 'bg-orange-500 text-white',
  medicine: 'bg-red-500 text-white',
  economics: 'bg-yellow-500 text-white',
  'social-sciences': 'bg-teal-500 text-white',
  'earth-sciences': 'bg-green-500 text-white',
  interdisciplinary: 'bg-indigo-500 text-white',
}

/** Sub-discipline badge style per discipline */
export const DISCIPLINE_BADGE_STYLES: Record<string, string> = {
  physics: 'bg-blue-50 text-blue-700 border-blue-200',
  optics: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  photonics: 'bg-violet-50 text-violet-700 border-violet-200',
  'materials-science': 'bg-amber-50 text-amber-700 border-amber-200',
  chemistry: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  biology: 'bg-rose-50 text-rose-700 border-rose-200',
  'computer-science': 'bg-sky-50 text-sky-700 border-sky-200',
  'artificial-intelligence': 'bg-purple-50 text-purple-700 border-purple-200',
  mathematics: 'bg-slate-50 text-slate-700 border-slate-200',
  engineering: 'bg-orange-50 text-orange-700 border-orange-200',
  medicine: 'bg-red-50 text-red-700 border-red-200',
  economics: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'social-sciences': 'bg-teal-50 text-teal-700 border-teal-200',
  'earth-sciences': 'bg-green-50 text-green-700 border-green-200',
  interdisciplinary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

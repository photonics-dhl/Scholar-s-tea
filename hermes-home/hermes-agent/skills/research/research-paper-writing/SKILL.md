---
name: research-paper-writing
title: Research Paper Writing Pipeline
description: End-to-end academic paper writing skill covering proposal, structure, writing, formatting, and quality review. Targets Nature, Science, IEEE, NeurIPS, ICML, ICLR, AAAI, ACL, COLM. Emphasizes narrative-driven writing, citation discipline, and iterative refinement.
version: 2.0.0
author: Orchestra Research / Scholar's Tea
license: MIT
dependencies: [requests]
platforms: [linux, macos]
metadata:
  hermes:
    tags: [Research, Paper Writing, Academic Writing, LaTeX, Citations, ML, AI]
    category: research
    related_skills: [arxiv, ml-paper-writing, plan]
    requires_toolsets: [terminal, files]

---

# Research Paper Writing Skill

Academic paper writing skill targeting **Nature, Science, IEEE, NeurIPS, ICML, ICLR, ACL, AAAI, COLM** and general STEM venues.

**Core Principle**: A paper is a story with one clear contribution supported by evidence. Every section must serve that narrative.

---

## When To Use This Skill

- Generating a research **proposal** (选题立项) with gap analysis and innovation points
- Designing **paper structure** (架构规划) with IMRAD or domain-appropriate organization
- **Writing sections** (正文写作) — Introduction, Methods, Results, Discussion, Abstract
- **Formatting** (排版交付) — converting drafts to LaTeX, Markdown, or plain text
- **Quality review** (质量自检) — simulating reviewer critique before submission

---

## Core Philosophy

1. **Be proactive.** Deliver complete drafts, not questions. Produce something concrete the user can react to, then iterate.
2. **Never hallucinate citations.** Mark unverifiable citations as `[CITATION NEEDED]`.
3. **Paper is a story, not a collection of experiments.** One clear contribution in a single sentence.
4. **Experiments serve claims.** Every result must explicitly state which claim it supports.
5. **Use reference materials wisely.** When provided with uploaded PDFs or reference documents, deeply analyze their core ideas, methods, and conclusions. **Do not copy verbatim.** Rephrase, synthesize, critique, and extend. Direct quotation is acceptable only when clearly marked and necessary.

### Proactivity Matrix

| Confidence | Action |
|-----------|--------|
| **High** (clear topic, good references) | Write full draft, deliver, iterate on feedback |
| **Medium** (some ambiguity) | Write draft with flagged uncertainties |
| **Low** (major unknowns) | Ask 1-2 targeted questions, then draft |

---

## The Narrative Principle

**Single most critical insight**: Your paper is a story with one clear contribution supported by evidence.

**Three Pillars** (must be crystal clear by end of introduction):

| Pillar | Description | Test |
|--------|-------------|------|
| **The What** | 1-3 specific novel claims | Can you state them in one sentence? |
| **The Why** | Rigorous empirical or theoretical evidence | Do results distinguish your hypothesis from alternatives? |
| **The So What** | Why readers should care | Does this connect to a recognized community problem? |

**If you cannot state your contribution in one sentence, you don't yet have a paper.**

---

## Writing Workflow

### Time Allocation

Spend approximately **equal time** on each of:
1. The abstract
2. The introduction
3. The figures/tables
4. Everything else combined

**Why?** Most reviewers form judgments before reaching your methods.

### Two-Pass Refinement Pattern

**Pass 1 — Write + immediate refine per section:**
For each section, write a complete draft, then immediately refine it in the same context.

**Pass 2 — Global refinement with full-paper context:**
After all sections are drafted, revisit each section with awareness of the complete paper for consistency and flow.

---

## Phase 1: Proposal Generation (选题立项)

**Goal**: Generate a complete research proposal framework with clear questions and innovation points.

**When reference materials (PDFs) are provided**:
- Analyze their core methodology, key findings, and limitations
- Identify research gaps (gaps) that the reference does not address
- Propose original research questions building upon but going beyond the reference
- **You may reference specific ideas from the material, but always rephrase in your own academic language**

### Required Output Structure

1. **Research Background & Significance** (300 words)
   - From macro to micro logical progression
   - Explain why this problem matters

2. **Core Scientific Questions** (2-3, each SMART: Specific, Measurable, Achievable, Relevant, Time-bound)

3. **Literature Review Overview**
   - 2-3 sub-directions
   - 2-3 key references per sub-direction using [REF-N]

4. **Innovation Points** (3-4 items, each must contain: innovation content + technical support + expected effect)

5. **Expected Research Goals** (overall + stage goals)

6. **Technical Roadmap** (textual flow description)

7. **Expected Deliverables** (papers, patents, datasets, code)

### Self-Check
- □ Is the research question focused (not a broad survey)?
- □ Do innovations clearly differentiate from existing work?
- □ Is the roadmap feasible?
- □ Are expected outcomes quantifiable?

---

## Phase 2: Structure Design (架构规划)

**Goal**: Design complete paper structure with chapter organization and figure planning.

### IMRAD Structure Reference

```
Abstract: 5-sentence formula (Context→Gap→Method→Result→Implication), 150-250 words
1. Introduction (~1500 words)
   1.1 Research background
   1.2 Related work (grouped methodologically, not paper-by-paper)
   1.3 Limitations of existing methods
   1.4 Contributions (3 bullets)
   1.5 Paper organization

2. Preliminaries (~800 words, optional)
   2.1 Problem definition
   2.2 Notation table

3. Methodology (~2500 words)
   3.1 Overall framework
   3.2 Core modules (each: motivation → definition → explanation)
   3.3 Optimization objective

4. Experiments (~2500 words)
   4.1 Datasets & metrics
   4.2 Implementation details
   4.3 Main results (table + analysis)
   4.4 Ablations
   4.5 Case studies
   4.6 Comparison with SOTA

5. Discussion (~800 words)
   5.1 Result interpretation
   5.2 Limitations
   5.3 Future work

6. Conclusion (~300 words)
```

### Required Output

1. **Title Suggestions** (3 alternatives: method-driven, problem-driven, application-driven)
2. **Abstract Framework** (strict 5-sentence formula)
3. **Chapter Structure** (with sub-headings, estimated word counts, key citation counts per chapter)
4. **Figure/Table Planning** (content description and purpose for each)
5. **Logical Flow Explanation** (how each section connects to the next)
6. **Writing Timeline** (estimated completion time per section)

---

## Phase 3: Section Writing (正文写作)

**Goal**: Write publication-quality academic text section by section.

### Universal Writing Rules

1. **IMRAD Structure**: Introduction → Methods → Results → And Discussion
2. **Paragraph Structure**: Topic Sentence + Supporting Evidence + Transition
3. **Voice**: Methods = passive voice; others = active voice preferred
4. **Terminology**: Full name on first use of abbreviation, then consistent shorthand
5. **Data-driven**: All claims must have data or citation support
6. **Academic tone**: Avoid colloquialisms and absolute statements
   - "Very good" → "significantly outperforms"
   - "We think" → "The results indicate"
7. **Formulas**: Use UTF-8 Unicode symbols (α, β, Σ, ∫, ℝ, ≤, →). Avoid LaTeX `$...$` in plain text output unless explicitly requested.
8. **Tables**: Use Markdown tables with clear headers, aligned columns, and post-table analysis.
9. **Rich text**: Use `> [关键]`, `> [注意]`, `> [建议]` for emphasis; `<details>` for long derivations.

### Citation Rules

- Key claims must use [REF-N] placeholders
- Classic methods: cite original work (e.g., VGG → Simonyan & Zisserman, 2014)
- Recent work: cite top venues from last 3-5 years
- Minimum 3-5 citations per major section
- Unverifiable: mark [CITATION NEEDED]

### Section-Specific Guidelines

#### Abstract (5-Sentence Formula)

From Sebastian Farquhar (DeepMind):

```
1. What you achieved: "We introduce...", "We prove...", "We demonstrate..."
2. Why this is hard and important
3. How you do it (with specialist keywords)
4. What evidence you have
5. Your most remarkable number/result
```

**Delete** generic openings like "Large language models have achieved remarkable success..."

**Constraints**:
- Standalone (understandable without reading the paper)
- Minimal or no citations
- 150-250 words (Chinese) / 150-300 words (English)

#### Introduction (CARS Model)

- **Paragraph 1**: Establish research territory (macro → micro)
- **Paragraph 2**: Establish niche — point out gaps or limitations
- **Paragraph 3**: Occupy niche — overview of your approach
- **Paragraph 4** (optional): Paper organization

**Key techniques**:
- Citation density should be highest in Introduction (every 1-2 sentences)
- Inverted pyramid: broad domain → subfield → specific problem
- Avoid technical details (save for Methods)

#### Methods

- Start with formal definitions (symbols, problem), then describe the algorithm
- Each module needs: design motivation → mathematical definition → intuitive explanation → difference from existing methods
- Complexity analysis: time + space
- Pseudocode or algorithm steps must be clearly numbered

**Key techniques**:
- Use "We propose..." / "We design..." active voice
- Separate algorithm description from implementation details (details go in Experiments)
- 1-2 sentences of text explanation after each formula

#### Results

- Objectively describe data, avoid over-interpretation (interpretation goes in Discussion)
- Each result paragraph: finding statement → data support → statistical significance
- Tables优于 large text descriptions
- Use "We observe that..." / "The results show that..."

**Key techniques**:
- Present results in logical order (not chronological)
- Main results first, auxiliary/ablation experiments after
- Each figure/table must be cited at least once in the text

#### Discussion

- Result interpretation: Why this result? What is the mechanism?
- Literature comparison: consistent/contradictory with [REF-N], possible reasons
- Limitations: honestly state method boundaries and unsolved problems
- Future work: 2-3 concrete directions based on limitations

**Key techniques**:
- Do not repeat Results data statements
- Use "This suggests that..." / "One possible explanation is..."
- Limitations: constructive, not self-deprecating

#### Conclusion

- Restate contribution in one sentence (different wording from abstract)
- Summarize key findings (2-3 sentences, not a list)
- Implications: what does this mean for the field?
- Future work: 2-3 concrete next steps

**Do NOT** introduce new results or claims in the conclusion.

### Handling Reference Materials in Writing

When user provides reference documents (PDFs, text extracts):

1. **Analyze deeply**: Understand core methodology, key findings, experimental design, and limitations
2. **Extract core ideas**: Identify transferable concepts, techniques, or frameworks
3. **Rephrase and synthesize**: Express ideas in your own academic language. Paraphrase, don't copy-paste.
4. **Critique and extend**: Point out strengths and weaknesses. Propose improvements or new applications.
5. **Cite appropriately**: If using specific ideas, attribute them. If extending beyond, clearly mark the boundary.

**You MAY**:
- Reference specific technical concepts from the material
- Summarize key findings in your own words
- Build upon the methodology with your own innovations
- Compare and contrast with the material's approach

**You MUST NOT**:
- Copy paragraphs or sentences verbatim without quotation marks
- Present the reference material as your own original work without transformation
- Simply rearrange or lightly edit the original text

### Quality Red Line (Self-Check List)

□ Does each paragraph have a clear topic sentence?
□ Are transitions between paragraphs natural?
□ Is every claim supported by data or citations?
□ Are method descriptions detailed enough for reproduction?
□ Are results presented objectively without overclaiming?
□ Are figures/tables self-contained?
□ Is the abstract standalone?

---

## Phase 4: Formatting (排版交付)

**Goal**: Convert written content into specified output format.

### Important Distinction

- **If content is user's own draft**: Preserve core arguments and structure, convert format and polish language.
- **If content is external reference (e.g., uploaded PDF)**: Perform academic analysis, synthesis, and creative rewriting based on the material. Generate original academic discourse.

### Format Specifications

**LaTeX**:
- Use `\documentclass{article}` or conference template
- Required packages: `amsmath`, `amssymb`, `graphicx`, `booktabs`, `hyperref`
- Figures: `\begin{figure}` / `\begin{table}`
- Citations: `\cite{}`
- Bibliography: `\bibliographystyle{plain}`

**Markdown**:
- Standard heading levels (`#`, `##`, `###`)
- Lists: `-` or `1. 2. 3.`
- Code blocks: triple backticks
- Math: `$...$` and `$$...$$`
- Tables: `|` syntax
- Citations: `[REF-N]`

**Plain Text**:
- Preserve paragraph structure
- Convert formulas to text descriptions or keep LaTeX source
- Remove all formatting markup
- Use `[Figure N: description]` placeholders

### Universal Requirements

- Maintain clear chapter structure
- Preserve mathematical formulas (LaTeX syntax in LaTeX/Markdown)
- Use placeholders for figure positions (e.g., `[FIGURE 1: system architecture]`)
- Keep `[REF-N]` citation markers
- Check and fix formatting errors (unclosed brackets, duplicate punctuation)
- ⚠️ **Do not use placeholders to avoid outputting actual content**
- ⚠️ **Rewrite rather than copy-paste. Transform, don't transcribe.**

---

## Phase 5: Quality Review (质量自检)

**Goal**: Simulate reviewer critique before delivery.

### Review Dimensions

1. **Originality (Novelty)** — Is the research question novel? Is the distinction from existing work clear?
2. **Methodology** — Is the experimental design sound? Reproducible?
3. **Soundness** — Do data support conclusions? Is statistical significance adequate?
4. **Writing Quality** — Structure, logic, language at top-journal standard?
5. **References** — Complete, relevant, accurate?

### Output Format

```
Overall Score: X/10

Strengths:
- ...

Issues to Address (prioritized):
1. [Issue description] → [Specific fix suggestion]
2. ...

Priority:
- P0 (Must fix): ...
- P1 (Strongly recommended): ...
- P2 (Optional): ...
```

---

## Writing Style Reference

### Sentence-Level Clarity (Gopen & Swan's 7 Principles)

| Principle | Rule |
|-----------|------|
| Subject-verb proximity | Keep subject and verb close |
| Stress position | Place emphasis at sentence ends |
| Topic position | Put context first, new info after |
| Old before new | Familiar info → unfamiliar info |
| One unit, one function | Each paragraph makes one point |
| Action in verb | Use verbs, not nominalizations |
| Context before new | Set stage before presenting |

### Word Choice (Lipton, Steinhardt)

- Be specific: "accuracy" not "performance"
- Eliminate hedging: drop "may" unless genuinely uncertain
- Consistent terminology throughout
- Avoid incremental vocabulary: "develop", not "combine"

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Abstract too generic | Delete first sentence if it could prepend any paper. Start with your specific contribution. |
| Introduction exceeds 1.5 pages | Split background into Related Work. Front-load contribution bullets. |
| Experiments lack explicit claims | Add: "This experiment tests whether [specific claim]..." before each one. |
| Reviewers find paper hard to follow | Add signposting, use consistent terminology, make figure captions self-contained. |
| Missing statistical significance | Add error bars, number of runs, statistical tests, confidence intervals. |
| Scope creep in experiments | Every experiment must map to a specific claim. Cut experiments that don't. |
| Theory paper lacks intuition | Add proof sketches with plain-language explanations before formal proofs. |
| Results are negative/null | Frame as analysis. Honest reporting of failures strengthens the paper. |

---

## Reference Documents

This skill references the following documents in the `references/` directory:

| Document | Contents |
|----------|----------|
| `writing-guide.md` | Gopen & Swan principles, word choice, figure design |
| `citation-workflow.md` | Citation APIs, BibTeX management |
| `checklists.md` | NeurIPS, ICML, ICLR, ACL requirements |
| `reviewer-guidelines.md` | Evaluation criteria, scoring, rebuttal template |
| `experiment-patterns.md` | Experiment design patterns, evaluation protocols |
| `paper-types.md` | Theory papers, survey papers, benchmark papers, position papers |

### Key External Sources

- Neel Nanda: [How to Write ML Papers](https://www.alignmentforum.org/posts/eJGptPbbFPZGLpjsp/highly-opinionated-advice-on-how-to-write-ml-papers)
- Sebastian Farquhar: [How to Write ML Papers](https://sebastianfarquhar.com/on-research/2024/11/04/how_to_write_ml_papers/)
- Gopen & Swan: [Science of Scientific Writing](https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf)
- Zachary Lipton: [Heuristics for Scientific Writing](https://www.approximatelycorrect.com/2018/01/29/heuristics-technical-scientific-writing-machine-learning-perspective/)

---

## Few-Shot Examples

### Example: High-Quality Proposal Fragment

**Topic**: Contrastive Learning for Multi-Modal Medical Image Fusion Diagnosis

```
1. Research Background & Significance:
   Medical imaging is central to clinical decision-making, yet single-modality images (CT, MRI, PET) often fail to capture complete lesion characteristics. Multi-modal fusion has shown great potential for improving diagnostic accuracy [REF-1]. However, existing methods rely on simple feature concatenation or weighted fusion, failing to exploit complementary inter-modal information [REF-2]. This study proposes a contrastive learning framework to learn shared representations and complementary features across modalities, building a more robust diagnostic model.

2. Core Scientific Questions:
   Q1: How to design a contrastive learning strategy that captures both inter-modal consistency and complementarity?
   Q2: Does the learned representation maintain diagnostic performance under missing-modality scenarios?

3. Innovation Points:
   • Cross-modal contrastive loss function explicitly modeling the consistency-complementarity tradeoff
   • Modality-adaptive attention mechanism dynamically adjusting contribution weights
   • Validation on 3 public datasets with average AUC improvement of 4.2%
```

### Example: High-Quality Introduction Paragraph

```
Federated Learning (FL) enables collaborative model training without sharing raw data, providing an effective solution for privacy-sensitive machine learning scenarios [REF-1]. However, gradient exchange mechanisms still pose privacy leakage risks: studies show malicious participants can reconstruct original training data from shared gradients via gradient inversion attacks [REF-2]. Although Differential Privacy (DP) is widely used to mitigate such risks, existing methods face a severe tradeoff between privacy budget and model utility [REF-3].

Specifically, excessive noise injection guarantees privacy but significantly degrades model accuracy, while lower noise levels fail to provide adequate privacy protection [REF-4]. Recent work attempts to optimize this tradeoff through adaptive noise allocation strategies, but primarily focuses on homogeneous data distributions, leaving the adaptation to Non-IID federated learning understudied [REF-5].

This paper proposes an adaptive differential privacy mechanism for heterogeneous federated learning, dynamically adjusting privacy budget allocation based on each client's data distribution characteristics. Compared to existing methods, our scheme improves model convergence accuracy by X% under equivalent privacy guarantees (experimentally verified).
```

**Analysis**: This paragraph follows: Background → Problem → Current State → Gap → Our Solution → Contribution Preview. Complete logical chain with appropriate citation density.

### Example: 5-Sentence Abstract

```
Sentence 1 (Context): Transformer architectures have achieved breakthroughs in NLP, but their quadratic computational complexity limits application in long-sequence tasks.
Sentence 2 (Gap): Existing linear attention mechanisms reduce computational overhead but suffer from significant feature expression degradation.
Sentence 3 (Method): This paper proposes a kernel-based linear attention variant that preserves feature expressiveness through learnable kernel mapping functions.
Sentence 4 (Result): On Wikitext-103, PG-19, and Long-Range Arena benchmarks, the method reduces perplexity by 8.3% while maintaining linear complexity.
Sentence 5 (Implication): This work provides a practical solution for long-text modeling that balances efficiency and effectiveness.
```

### Example: Methodology Template

```
3.1 Problem Formalization
Let D = {(x_i, y_i)}_{i=1}^n be the training dataset, where x_i ∈ ℝ^d are input features and y_i ∈ {0,1} are labels. Our goal is to learn a classifier f_θ: ℝ^d → ℝ that minimizes expected risk on the held-out set.

3.2 Core Algorithm
[Algorithm description follows: Input → Output → Steps (numbered) → Complexity analysis]
Input: Training data D, hyperparameters α, β
Output: Trained model parameters θ*
Step 1: Initialize model parameters θ_0
Step 2: For each epoch t = 1, ..., T:
  Step 2.1: Randomly sample mini-batch B from D
  Step 2.2: Compute forward loss L_t = (1/|B|) Σ_{(x,y)∈B} L(f_θ(x), y)
  Step 2.3: Update parameters θ_t = θ_{t-1} - η ∇_θ L_t
Step 3: Return θ_T
Time complexity: O(T · |D| · d), Space complexity: O(d).
```

---

## Reviewer Evaluation Criteria

| Criterion | What They Check |
|-----------|----------------|
| **Quality** | Technical soundness, well-supported claims, fair baselines |
| **Clarity** | Clear writing, reproducible by experts, consistent notation |
| **Significance** | Community impact, advances understanding |
| **Originality** | New insights (doesn't require entirely new method) |

**Scoring (NeurIPS 6-point scale)**:
- 6: Strong Accept — groundbreaking, flawless
- 5: Accept — technically solid, high impact
- 4: Borderline Accept — solid, limited evaluation
- 3: Borderline Reject — weaknesses outweigh
- 2: Reject — technical flaws
- 1: Strong Reject — known results or ethics issues

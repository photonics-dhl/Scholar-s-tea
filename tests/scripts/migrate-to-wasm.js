const fs = require('fs');
const path = require('path');

const { WasmEntrolyEngine } = require('C:/Users/Mac/AppData/Roaming/npm/node_modules/entroly-wasm');

const engine = new WasmEntrolyEngine();

const PROJECT_ROOT = 'z:/321/DHL/Scholar\'s_Tea';

// Estimate token count (rough: 1 token ≈ 4 chars for code)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Collect files recursively
function collectFiles(dir, exts, maxDepth = 4, depth = 0) {
    if (depth > maxDepth) return [];
    const results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Skip common non-project dirs
                const skip = ['node_modules', '.next', '.git', 'dist', 'build', '__pycache__', '.venv', 'coverage', '.cache', '.claude', '.entroly', '.hermes', 'logs'];
                if (skip.includes(entry.name)) continue;
                results.push(...collectFiles(fullPath, exts, maxDepth, depth + 1));
            } else if (entry.isFile() && exts.some(ext => entry.name.endsWith(ext))) {
                results.push(fullPath);
            }
        }
    } catch (e) {
        // ignore permission errors
    }
    return results;
}

console.log('=== Entroly WASM Migration: Beliefs + Source Code ===\n');

// 1. Ingest beliefs
const beliefsDir = path.join(PROJECT_ROOT, '.entroly', 'vault', 'beliefs');
const beliefFiles = fs.readdirSync(beliefsDir).filter(f => f.endsWith('.md'));
console.log(`Found ${beliefFiles.length} belief files`);

let totalBeliefTokens = 0;
for (const bf of beliefFiles) {
    const content = fs.readFileSync(path.join(beliefsDir, bf), 'utf8');
    const tokens = estimateTokens(content);
    totalBeliefTokens += tokens;
    engine.ingest(content, `belief:${bf}`, tokens, false);
}
console.log(`Ingested ${beliefFiles.length} beliefs ≈ ${totalBeliefTokens} tokens`);

// 2. Ingest source code
const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.prisma', '.sql'];
const srcDirs = ['src', 'prisma', 'server/src', 'scripts'];
let totalCodeFiles = 0;
let totalCodeTokens = 0;

for (const srcDir of srcDirs) {
    const fullDir = path.join(PROJECT_ROOT, srcDir);
    if (!fs.existsSync(fullDir)) continue;
    const files = collectFiles(fullDir, codeExts, 5);
    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            // Skip very large files (>50KB)
            if (content.length > 50000) {
                console.log(`  Skipping large file: ${file} (${Math.round(content.length/1024)}KB)`);
                continue;
            }
            const tokens = estimateTokens(content);
            const relPath = path.relative(PROJECT_ROOT, file);
            totalCodeFiles++;
            totalCodeTokens += tokens;
            engine.ingest(content, relPath, tokens, false);
        } catch (e) {
            // ignore
        }
    }
}
console.log(`Ingested ${totalCodeFiles} source files ≈ ${totalCodeTokens} tokens`);

// 3. Ingest docs
const docFiles = collectFiles(path.join(PROJECT_ROOT, 'docs'), ['.md'], 2);
let totalDocTokens = 0;
for (const file of docFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const tokens = estimateTokens(content);
    totalDocTokens += tokens;
    engine.ingest(content, `docs:${path.relative(PROJECT_ROOT, file)}`, tokens, false);
}
console.log(`Ingested ${docFiles.length} doc files ≈ ${totalDocTokens} tokens`);

const totalIngested = totalBeliefTokens + totalCodeTokens + totalDocTokens;
console.log(`\n=== Total Ingested ===`);
console.log(`Fragments: ${engine.fragment_count()}`);
console.log(`Estimated tokens: ${totalIngested}`);

// 4. Run optimize
const BUDGET = 128000;
const QUERY = 'implement new feature in the tea platform';

console.log(`\n=== optimize() with budget=${BUDGET} ===`);
const opt = engine.optimize(BUDGET, QUERY);
console.log(`Selected fragments: ${opt.selected_count}`);
console.log(`Selected tokens: ${opt.total_tokens}`);
console.log(`Tokens saved: ${opt.tokens_saved}`);
console.log(`Savings ratio: ${((opt.tokens_saved / totalIngested) * 100).toFixed(1)}%`);
console.log(`Budget utilization: ${(opt.budget_utilization * 100).toFixed(1)}%`);
console.log(`Context efficiency: ${(opt.context_efficiency * 100).toFixed(1)}%`);
console.log(`Skeleton count: ${opt.skeleton_count}`);
console.log(`Coverage: ${opt.coverage}`);
console.log(`Sufficiency: ${opt.sufficiency}`);

// 5. Run hierarchical_compress
console.log(`\n=== hierarchical_compress() with budget=${BUDGET} ===`);
const hc = engine.hierarchical_compress(BUDGET, QUERY);
console.log(`Status: ${hc.status}`);
console.log(`Level1 tokens (map): ${hc.level1_tokens}`);
console.log(`Level2 tokens (cluster): ${hc.level2_tokens}`);
console.log(`Level3 tokens (detail): ${hc.level3_tokens}`);
console.log(`Level3 count: ${hc.level3_count}`);
const hcTotal = hc.level1_tokens + hc.level2_tokens + hc.level3_tokens;
console.log(`Total compressed tokens: ${hcTotal}`);
console.log(`Compression ratio vs original: ${((1 - hcTotal / totalIngested) * 100).toFixed(1)}%`);

// 6. Engine stats
console.log(`\n=== Engine Stats ===`);
const stats = engine.stats();
console.log(`Session fragments: ${stats.session.total_fragments}`);
console.log(`Session tokens tracked: ${stats.session.total_tokens_tracked}`);
console.log(`Total optimizations: ${stats.savings.total_optimizations}`);
console.log(`Total tokens saved: ${stats.savings.total_tokens_saved}`);
console.log(`Dedup indexed: ${stats.dedup.indexed_fragments}`);

// Save state
const statePath = path.join(PROJECT_ROOT, '.entroly', 'wasm-engine-state.json');
fs.writeFileSync(statePath, JSON.stringify(engine.export_state(), null, 2));
console.log(`\nWASM engine state saved to: ${statePath}`);

const fs = require("fs");
let text = fs.readFileSync("scripts/seed-knowledge-v3.ts", "utf8");

const lines = text.split("\n");
const fixed = lines.map(line => {
  if (!line.includes("abstract:")) return line;

  // Match abstract: '...' or abstract: `...`
  const m = line.match(/abstract:\s*['`](.+?)['`](,?\s*})/);
  if (!m) return line;

  let inner = m[1];
  // Unescape \\' -> '
  inner = inner.replace(/\\\\'/g, "'");
  // Unescape \\` -> `
  inner = inner.replace(/\\\\`/g, "`");

  return line.replace(/abstract:\s*['`].+?['`]/, "abstract: \"" + inner + "\"");
});

fs.writeFileSync("scripts/seed-knowledge-v3.ts", fixed.join("\n"), "utf8");
console.log("Fixed with Node");

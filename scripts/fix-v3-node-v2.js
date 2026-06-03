const fs = require("fs");
let text = fs.readFileSync("scripts/seed-knowledge-v3.ts", "utf8");

// Step 1: globally replace all \\\' with just '
text = text.replace(/\\\\'/g, "'");

// Step 2: globally replace all \\\` with just `
text = text.replace(/\\\\`/g, "`");

// Step 3: fix abstract lines that may now have broken string delimiters
// For each line containing abstract:, change outer quotes to double quotes
const lines = text.split("\n");
const fixed = lines.map(line => {
  const idx = line.indexOf("abstract:");
  if (idx === -1) return line;

  // Find the first quote char after abstract:
  let start = idx + "abstract:".length;
  while (start < line.length && /\s/.test(line[start])) start++;
  const openChar = line[start];
  if (openChar !== "'" && openChar !== "`") return line;

  // Find the last matching quote before the closing }
  // We know the metadata ends with }, so find the last quote before that
  const endBrace = line.lastIndexOf("}");
  if (endBrace === -1) return line;

  // Find the quote just before the comma before }
  let closePos = -1;
  for (let i = endBrace - 1; i > start; i--) {
    if (line[i] === openChar && line[i-1] !== "\\") {
      closePos = i;
      break;
    }
  }
  if (closePos === -1) return line;

  const inner = line.slice(start + 1, closePos);
  // Now rebuild with double quotes, escaping any inner double quotes
  const escaped = inner.replace(/"/g, '\\"');
  return line.slice(0, start) + '"' + escaped + '"' + line.slice(closePos + 1);
});

fs.writeFileSync("scripts/seed-knowledge-v3.ts", fixed.join("\n"), "utf8");
console.log("Fixed v2");

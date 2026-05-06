#!/usr/bin/env node
/**
 * MCP Shrink Proxy
 * 复用 caveman-shrink + RTK 策略：压缩 MCP tool descriptions，减少每轮 token 注入。
 * Windows 兼容：使用 cross-spawn 逻辑，shell: true 处理 npx/cmd 等。
 */

const { spawn } = require("child_process");
const readline = require("readline");

// --- Caveman-style compression rules ---
function shrinkText(text) {
  if (!text || typeof text !== "string") return text;

  return (
    text
      // Remove filler phrases
      .replace(/\bThis (?:is a|is an|tool|function|command)\s*/gi, "")
      .replace(/\bUsed? to\s+/gi, "")
      .replace(/\bAllows? (?:you|the user)\s+to\s+/gi, "")
      .replace(/\bEnables?\s+/gi, "")
      .replace(/\bProvides?\s+/gi, "")
      .replace(/\bHelps?\s+/gi, "")
      .replace(/\bFacilitates?\s+/gi, "")
      .replace(/\b(The following|Please|You can|Simply|Just)\s+/gi, "")
      // Remove articles
      .replace(/\b(a|an|the)\s+/gi, "")
      // Remove hedging/qualifiers
      .replace(/\b(likely|probably|generally|typically|usually|often|possibly)\s+/gi, "")
      // Remove pleasantries
      .replace(/\b(Note that|Be aware|Keep in mind|It is important|Remember)\s+/gi, "")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

function shrinkObject(obj, fields = ["description"]) {
  if (Array.isArray(obj)) {
    return obj.map((item) => shrinkObject(item, fields));
  }
  if (obj && typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (fields.includes(key) && typeof value === "string") {
        result[key] = shrinkText(value);
      } else {
        result[key] = shrinkObject(value, fields);
      }
    }
    return result;
  }
  return obj;
}

// --- MCP Proxy ---
const upstreamCommand = process.argv[2];
const upstreamArgs = process.argv.slice(3);

if (!upstreamCommand) {
  console.error("Usage: node mcp-shrink.js <command> [args...]");
  process.exit(1);
}

const isWin = process.platform === "win32";
let child;
if (isWin) {
  // Windows: shell=true with args triggers deprecation. Join into single command.
  const fullCmd = [upstreamCommand, ...upstreamArgs].map(a => {
    // Simple quote wrap for args with spaces
    return a.includes(" ") ? `"${a.replace(/"/g, '""')}"` : a;
  }).join(" ");
  child = spawn(fullCmd, [], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
    windowsHide: true,
  });
} else {
  child = spawn(upstreamCommand, upstreamArgs, {
    stdio: ["pipe", "pipe", "pipe"],
  });
}

const rl = readline.createInterface({ input: child.stdout });

// Pass stderr through
child.stderr.on("data", (data) => {
  process.stderr.write(data);
});

rl.on("line", (line) => {
  try {
    const msg = JSON.parse(line);
    // Intercept tools/list, prompts/list, resources/list responses
    if (
      msg.result &&
      (msg.result.tools || msg.result.prompts || msg.result.resources)
    ) {
      msg.result = shrinkObject(msg.result);
    }
    process.stdout.write(JSON.stringify(msg) + "\n");
  } catch {
    // Not JSON, pass through
    process.stdout.write(line + "\n");
  }
});

// Pass stdin to upstream
process.stdin.on("data", (data) => {
  child.stdin.write(data);
});

process.stdin.on("end", () => {
  child.stdin.end();
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

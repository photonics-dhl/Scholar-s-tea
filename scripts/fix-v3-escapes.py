import re

with open("scripts/seed-knowledge-v3.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Pattern: abstract: '...content with \\\'...'
# We need to change outer single quotes to backticks and unescape \\\' -> '
def fix_abstract(m):
    inner = m.group(1)
    # Unescape doubled backslash-quote to simple quote
    inner = inner.replace("\\\\'", "'")
    return "abstract: `" + inner + "`"

# Match abstract: '...' where the content may contain \' escapes
text = re.sub(r"abstract: '([^']*(?:\\'[^']*)*)'", fix_abstract, text)

with open("scripts/seed-knowledge-v3.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed abstract escapes")

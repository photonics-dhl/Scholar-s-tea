import re

with open("scripts/seed-knowledge-v3.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()

fixed = []
for line in lines:
    if "abstract:" in line:
        # Replace abstract: '...' with abstract: `...`
        # The content may contain \\\' which we want to become just '
        m = re.search(r"abstract: '(.+)'", line)
        if m:
            inner = m.group(1)
            inner = inner.replace("\\\\'", "'")
            line = "    abstract: `" + inner + "`,\n"
    fixed.append(line)

with open("scripts/seed-knowledge-v3.ts", "w", encoding="utf-8") as f:
    f.writelines(fixed)

print("Fixed v2")

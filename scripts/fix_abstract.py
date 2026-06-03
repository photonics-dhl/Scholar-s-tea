import sys

with open('scripts/seed-knowledge-v3.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed = []
for line in lines:
    idx = line.find('abstract:')
    if idx == -1:
        fixed.append(line)
        continue

    start = idx + len('abstract:')
    while start < len(line) and line[start] in ' \t':
        start += 1

    open_char = line[start]
    if open_char not in ("'", '`'):
        fixed.append(line)
        continue

    close_pos = -1
    i = start + 1
    while i < len(line):
        if line[i] == open_char:
            if i > 0 and line[i-1] == '\\':
                i += 1
                continue
            close_pos = i
            break
        i += 1

    if close_pos == -1:
        fixed.append(line)
        continue

    inner = line[start+1:close_pos]
    inner = inner.replace("\\'", "'")
    inner = inner.replace("\\`", "`")
    inner = inner.replace('"', '\\"')

    new_line = line[:start] + '"' + inner + '"' + line[close_pos+1:]
    fixed.append(new_line)

with open('scripts/seed-knowledge-v3.ts', 'w', encoding='utf-8') as f:
    f.writelines(fixed)

print('Fixed with Python')

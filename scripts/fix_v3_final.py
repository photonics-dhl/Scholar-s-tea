import re

with open('scripts/seed-knowledge-v3.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all lines containing metadata and abstract, and reconstruct them properly
lines = text.split('\n')
fixed_lines = []

for line in lines:
    if 'abstract:' not in line or 'metadata:' not in line:
        fixed_lines.append(line)
        continue

    # This is a metadata line with abstract. Rebuild it.
    # Find the abstract value
    abs_idx = line.find('abstract:')
    if abs_idx == -1:
        fixed_lines.append(line)
        continue

    prefix = line[:abs_idx]
    rest = line[abs_idx + len('abstract:'):]

    # Skip whitespace
    i = 0
    while i < len(rest) and rest[i] in ' \t':
        i += 1

    if i >= len(rest):
        fixed_lines.append(line)
        continue

    open_char = rest[i]
    if open_char not in ("'", '"', '`'):
        fixed_lines.append(line)
        continue

    # Find matching close
    j = i + 1
    close_idx = -1
    while j < len(rest):
        if rest[j] == open_char and (j == 0 or rest[j-1] != '\\'):
            close_idx = j
            break
        j += 1

    if close_idx == -1:
        fixed_lines.append(line)
        continue

    inner = rest[i+1:close_idx]
    # Clean up escapes
    inner = inner.replace("\\\\'", "'")
    inner = inner.replace("\\\\`", "`")
    inner = inner.replace('"', '\\"')

    suffix = rest[close_idx+1:]
    # Remove any residual duplicate content in suffix
    # If suffix contains another "s," or similar residue, truncate at the first valid-looking end
    suffix = re.sub(r'[,\s]*s,\s*Parkinson.*?therapies\.[\'`"]?\s*}', ' }', suffix)

    new_line = prefix + 'abstract: "' + inner + '"' + suffix
    fixed_lines.append(new_line)

with open('scripts/seed-knowledge-v3.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(fixed_lines))

print('Fixed final')

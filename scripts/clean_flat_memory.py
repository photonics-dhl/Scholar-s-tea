#!/usr/bin/env python3
"""Remove duplicate entries from Flat Memory (MEMORY.md)."""

import re

memory_path = "/data/home/zju321/.hermes/memories/MEMORY.md"

with open(memory_path, 'r') as f:
    content = f.read()

# Split into sections by ## headers
sections = re.split(r'\n(?=## )', content)

# Track seen headers and content signatures
seen = {}
unique_sections = []

for section in sections:
    section = section.strip()
    if not section:
        continue

    # Extract header
    header_match = re.match(r'## (.+)', section)
    if not header_match:
        continue
    header = header_match.group(1).strip()

    # Create signature from first 30 chars of header
    lines = section.split('\n')
    signature = header.lower()[:30]

    # Check if we've seen this signature
    if signature not in seen:
        seen[signature] = header
        unique_sections.append(section)
    else:
        print(f"DEDUP: '{header}' (same as '{seen[signature]}')")

# Write back
new_content = '\n\n'.join(unique_sections)
with open(memory_path, 'w') as f:
    f.write(new_content)

print(f"Original: {len(sections)} sections")
print(f"After dedup: {len(unique_sections)} sections")
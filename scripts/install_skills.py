#!/usr/bin/env python3
import json
import os

# 1. Update global Claude Code settings
with open(r'C:\Users\Mac\.claude\settings.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

config['mcpServers']['token-savior'] = {
    'command': 'token-savior',
    'args': [],
    'env': {
        'WORKSPACE_ROOTS': '.',
        'TOKEN_SAVIOR_CLIENT': 'claude-code',
        'TOKEN_SAVIOR_PROFILE': 'tiny'
    }
}
config['mcpServers']['entroly'] = {
    'command': 'entroly',
    'args': ['serve'],
    'env': {}
}

with open(r'C:\Users\Mac\.claude\settings.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print('Global Claude Code: Added token-savior + entroly')
print('Total MCP servers:', len(config['mcpServers']))

# 2. Update project .mcp.json
with open(r'z:\321\DHL\Scholar\'s_Tea\.mcp.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

config['mcpServers']['token-savior'] = {
    'command': 'token-savior',
    'args': [],
    'env': {
        'WORKSPACE_ROOTS': 'z:/321/DHL/Scholar\'s_Tea',
        'TOKEN_SAVIOR_CLIENT': 'claude-code',
        'TOKEN_SAVIOR_PROFILE': 'lean'
    }
}
config['mcpServers']['entroly'] = {
    'command': 'entroly',
    'args': ['serve'],
    'env': {}
}

with open(r'z:\321\DHL\Scholar\'s_Tea\.mcp.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print('Project .mcp.json: Added token-savior + entroly')
print('Total MCP servers:', len(config['mcpServers']))

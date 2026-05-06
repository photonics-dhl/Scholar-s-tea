#!/usr/bin/env python3
"""Deploy token optimization configuration for Claude Code global settings."""
import json
import os
import sys

def main():
    path = r"C:\Users\Mac\.claude\settings.json"
    
    with open(path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    # Replace mcpServers with compressed versions + token-savior
    config["mcpServers"] = {
        "compressed-fs": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "medium",
                "--server-name", "fs",
                "npx", "-y", "@modelcontextprotocol/server-filesystem",
                "~/Documents", "~/Projects", "~/Desktop"
            ]
        },
        "compressed-github": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "high",
                "--server-name", "github",
                "npx", "-y", "@modelcontextprotocol/server-github"
            ],
            "env": {
                "GITHUB_TOKEN": "${GITHUB_TOKEN}"
            }
        },
        "compressed-puppeteer": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "medium",
                "--server-name", "browser",
                "npx", "-y", "@modelcontextprotocol/server-puppeteer"
            ]
        },
        "compressed-postgres": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "high",
                "--server-name", "pg",
                "npx", "-y", "@modelcontextprotocol/server-postgres"
            ],
            "env": {
                "DATABASE_URL": "${DATABASE_URL}"
            }
        },
        "compressed-fetch": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "high",
                "--server-name", "fetch",
                "npx", "-y", "@kazuph/mcp-fetch"
            ]
        },
        "compressed-memory": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "max",
                "--server-name", "mem",
                "npx", "-y", "@modelcontextprotocol/server-memory"
            ]
        },
        "compressed-thinking": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "max",
                "--server-name", "think",
                "npx", "-y", "@modelcontextprotocol/server-sequential-thinking"
            ]
        },
        "compressed-tavily": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "high",
                "--server-name", "tavily",
                "node",
                "C:/Users/Mac/.claude/tavily-rotate/dist/index.js"
            ],
            "env": {
                "http_proxy": "http://127.0.0.1:7890",
                "https_proxy": "http://127.0.0.1:7890",
                "TAVILY_API_KEY": "${TAVILY_API_KEY}"
            }
        },
        "compressed-scholar": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "high",
                "--server-name", "scholar",
                "npx", "-y", "@xbghc/semanticscholar-mcp"
            ]
        },
        "compressed-image": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "medium",
                "--server-name", "img",
                "npx", "-y", "mcp-image"
            ],
            "env": {
                "GEMINI_API_KEY": "${GEMINI_API_KEY}"
            }
        },
        "compressed-mermaid": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "medium",
                "--server-name", "mermaid",
                "npx", "-y", "mcp-mermaid"
            ]
        },
        "compressed-context7": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "high",
                "--server-name", "ctx7",
                "npx", "-y", "@upstash/context7-mcp@latest"
            ]
        },
        "compressed-ui": {
            "command": "uvx",
            "args": [
                "mcp-compressor",
                "--compression-level", "medium",
                "--server-name", "ui",
                "npx", "-y", "@iflow-mcp/ui-expert-mcp"
            ]
        },
        "token-savior": {
            "command": "uvx",
            "args": ["token-savior-recall"],
            "env": {
                "WORKSPACE_ROOTS": ".",
                "TOKEN_SAVIOR_CLIENT": "claude-code",
                "TOKEN_SAVIOR_PROFILE": "tiny"
            }
        }
    }
    
    # Add basic hooks
    config["hooks"] = {
        "SessionEnd": [
            {
                "hooks": [
                    {
                        "type": "command",
                        "command": "powershell -NoProfile -Command \"Write-Host 'Token optimization: Consider /compact if next session feels slow.' -ForegroundColor DarkGray\"",
                        "timeout": 5,
                        "once": False
                    }
                ]
            }
        ]
    }
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {path}")
    print(f"MCP servers: {len(config['mcpServers'])} (was 13)")
    print("Hooks: SessionEnd compact reminder added")

if __name__ == "__main__":
    main()

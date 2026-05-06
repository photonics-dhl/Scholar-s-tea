#!/usr/bin/env node
/**
 * Entroly WASM MCP Server
 * Wraps entroly-wasm (Rust engine) as an MCP stdio server.
 * Provides: optimize, ingest, recall, hierarchical_compress, stats
 */

const { WasmEntrolyEngine } = require(process.env.ENTROLY_WASM_PATH || 'entroly-wasm');

const engine = new WasmEntrolyEngine();

// MCP stdio transport helpers
let buffer = Buffer.alloc(0);

function sendMessage(msg) {
    const json = JSON.stringify(msg);
    const header = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n`;
    process.stdout.write(header + json);
}

function readMessages() {
    while (true) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) break;
        const header = buffer.slice(0, headerEnd).toString('utf8');
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
            buffer = buffer.slice(headerEnd + 4);
            continue;
        }
        const contentLength = parseInt(match[1], 10);
        const messageStart = headerEnd + 4;
        if (buffer.length < messageStart + contentLength) break;
        const body = buffer.slice(messageStart, messageStart + contentLength).toString('utf8');
        buffer = buffer.slice(messageStart + contentLength);
        try {
            handleRequest(JSON.parse(body));
        } catch (err) {
            sendMessage({ jsonrpc: '2.0', id: null, error: { code: -32700, message: String(err) } });
        }
    }
}

process.stdin.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    readMessages();
});

// Tool definitions
const TOOLS = [
    {
        name: 'optimize_context',
        description: 'Optimize context selection using knapsack + PRISM scoring. Returns the most relevant fragments within token budget.',
        inputSchema: {
            type: 'object',
            properties: {
                token_budget: { type: 'integer', description: 'Max tokens to return' },
                query: { type: 'string', description: 'Current task query for relevance scoring' }
            },
            required: ['token_budget', 'query']
        }
    },
    {
        name: 'ingest_fragment',
        description: 'Ingest a context fragment into the engine (SimHash dedup + entropy scoring).',
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                source: { type: 'string' },
                token_count: { type: 'integer' },
                is_pinned: { type: 'boolean', default: false }
            },
            required: ['content', 'source', 'token_count']
        }
    },
    {
        name: 'recall_relevant',
        description: 'Semantic recall of the most relevant stored fragments.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string' },
                top_k: { type: 'integer', default: 5 }
            },
            required: ['query']
        }
    },
    {
        name: 'hierarchical_compress',
        description: 'AST-based multi-resolution compression (Full/Skeleton/Reference). Highest compression ratio.',
        inputSchema: {
            type: 'object',
            properties: {
                token_budget: { type: 'integer' },
                query: { type: 'string' }
            },
            required: ['token_budget', 'query']
        }
    },
    {
        name: 'get_stats',
        description: 'Get engine statistics (fragments, savings, dedup, cache).',
        inputSchema: { type: 'object', properties: {} }
    },
    {
        name: 'clear_engine',
        description: 'Clear all fragments and reset engine.',
        inputSchema: { type: 'object', properties: {} }
    },
    {
        name: 'import_state',
        description: 'Import engine state from JSON string.',
        inputSchema: {
            type: 'object',
            properties: { json_str: { type: 'string' } },
            required: ['json_str']
        }
    },
    {
        name: 'export_state',
        description: 'Export full engine state as JSON string.',
        inputSchema: { type: 'object', properties: {} }
    }
];

function handleRequest(req) {
    const { id, method, params } = req;

    if (method === 'initialize') {
        sendMessage({
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'entroly-wasm', version: '0.12.0' }
            }
        });
        return;
    }

    if (method === 'tools/list') {
        sendMessage({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
        return;
    }

    if (method === 'tools/call') {
        const { name, arguments: args } = params || {};
        try {
            const result = handleTool(name, args || {});
            sendMessage({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } });
        } catch (err) {
            sendMessage({ jsonrpc: '2.0', id, error: { code: -32602, message: String(err) } });
        }
        return;
    }

    sendMessage({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
}

function handleTool(name, args) {
    switch (name) {
        case 'optimize_context':
            return engine.optimize(args.token_budget, args.query);
        case 'ingest_fragment':
            return engine.ingest(args.content, args.source, args.token_count || Math.ceil(args.content.length / 4), args.is_pinned || false);
        case 'recall_relevant':
            return engine.recall(args.query, args.top_k || 5);
        case 'hierarchical_compress':
            return engine.hierarchical_compress(args.token_budget, args.query);
        case 'get_stats':
            return engine.stats();
        case 'clear_engine':
            engine.clear();
            return { status: 'cleared' };
        case 'import_state':
            engine.import_state(args.json_str);
            return { status: 'imported' };
        case 'export_state':
            return { state: engine.export_state() };
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

// Keep alive until stdin closes
process.stdin.on('end', () => process.exit(0));

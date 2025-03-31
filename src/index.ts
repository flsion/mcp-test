import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {Tool, ListToolsRequestSchema, CallToolRequestSchema} from '@modelcontextprotocol/sdk/types.js'

// Create an MCP server
const server = new Server({
    name: "Demo",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {},
    }
});

const ADD: Tool = {
    name: 'add',
    description: 'add number',
    inputSchema: {
        type: 'object',
        properties: {
            a: {
                type: "number",
                description: 'number a'
            },
            b: {
                type: "number",
                description: 'number b'
            }
        },
        required: ["a", "b"]
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [ADD]
    }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;
    if (name === 'add') {
        if (!args) {
            throw new Error(`args is required`);
        }
        const {a, b} = args as any;
        return {
            content: [{type: "text", text: String(a + b)}],
            isError: false
        }
    }
    return {
        content: [{type: "text", text: 'Error'}],
        isError: true
    }
})

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
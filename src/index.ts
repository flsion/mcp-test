import express, {Request, Response} from "express";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import {z} from "zod";

// Create an MCP server
const server = new McpServer({
    name: "Demo",
    version: "1.0.0"
});

// Add an addition tool
// 提供计算
server.tool("add",
    {a: z.number(), b: z.number()},
    async ({a, b}) => ({
        // MCP 返回规范
        content: [{type: "text", text: String(a + b)}]
    })
);

// Add a dynamic greeting resource
// 提供数据
server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", {list: undefined}),
    async (uri, {name}) => ({
        // MCP 返回规范
        contents: [{
            uri: uri.href,
            text: `Hello, ${name}!`
        }]
    })
);

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: { [sessionId: string]: SSEServerTransport } = {};

// 建立 sse 连接
app.get("/sse", async (_: Request, res: Response) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        delete transports[transport.sessionId];
    });
    await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

app.listen(3001);
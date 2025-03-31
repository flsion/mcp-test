"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const zod_1 = require("zod");
// Create an MCP server
const server = new mcp_js_1.McpServer({
    name: "Demo",
    version: "1.0.0"
});
// Add an addition tool
// 提供计算
server.tool("add", { a: zod_1.z.number(), b: zod_1.z.number() }, (_a) => __awaiter(void 0, [_a], void 0, function* ({ a, b }) {
    return ({
        // MCP 返回规范
        content: [{ type: "text", text: String(a + b) }]
    });
}));
// Add a dynamic greeting resource
// 提供数据
server.resource("greeting", new mcp_js_1.ResourceTemplate("greeting://{name}", { list: undefined }), (uri_1, _a) => __awaiter(void 0, [uri_1, _a], void 0, function* (uri, { name }) {
    return ({
        // MCP 返回规范
        contents: [{
                uri: uri.href,
                text: `Hello, ${name}!`
            }]
    });
}));
const app = (0, express_1.default)();
// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};
// 建立 sse 连接
app.get("/sse", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = new sse_js_1.SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        delete transports[transport.sessionId];
    });
    yield server.connect(transport);
}));
app.post("/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    if (transport) {
        yield transport.handlePostMessage(req, res);
    }
    else {
        res.status(400).send('No transport found for sessionId');
    }
}));
app.listen(3001);

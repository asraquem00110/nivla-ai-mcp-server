import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { randomUUID } from "crypto";
import { envConfig } from "./env";
import cors from "cors";

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

function getServer() {
  // Create server instance
  const server = new McpServer({
    name: "local-mcp",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  server.tool(
    "get-db-status",
    "Get Database status",
    {
      machine: z.string().describe("machine id"),
    },
    async ({ machine }) => {
      console.log(machine);
      return {
        content: [
          {
            type: "text",
            text: "Machine status is active",
          },
        ],
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

// Allow CORS for localhost:5173
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: "*",
    methods: "*",
  })
);

app.post("/mcp", mcpPostHandler);

app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

async function mcpPostHandler(req: Request, res: Response) {
  console.log("Received MCP request:", req.body);
  console.log(req.headers);

  const server = getServer();
  try {
    const transport: StreamableHTTPServerTransport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
}

app.listen(envConfig.APP_PORT, () => {
  console.log(
    `MCP Streamable HTTP Server listening on port ${envConfig.APP_PORT}`
  );
});

// Handle server shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  process.exit(0);
});

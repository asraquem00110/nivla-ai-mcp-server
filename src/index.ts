import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolResult,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { randomUUID } from "crypto";
import { envConfig } from "./env";
import cors from "cors";
import { checkLocalJsonFile, getDbStatus } from "@/tools";

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
    "Get Deposit Records Status in local MongoDB",
    {
      deposit: z.string().describe("deposit record identification"),
    },
    async ({ deposit }) => {
      const depositRecordResult = await getDbStatus({
        deposit,
      });
      return {
        content: [
          {
            type: "text",
            text: `Deposit Record Details is ${JSON.stringify(
              depositRecordResult
            )}`,
          },
        ],
      };
    }
  );

  server.tool(
    "check-local-json-file",
    "Check Machine Status from local JSON file information",
    {
      machine: z.string().describe("machine serial number"),
    },
    async ({ machine }, { sendNotification }): Promise<CallToolResult> => {
      // await sendNotification({
      //   method: "notifications/message",
      //   params: {
      //     level: "info",
      //     data: `Sending first notification from ${machine}`,
      //   },
      // });

      const result = await checkLocalJsonFile({
        machine,
      });
      return {
        content: [
          {
            type: "text",
            text: `Machine information is ${JSON.stringify(result[0])}`,
          },
        ],
      };
    }
  );

  server.tool(
    "call-api-endpoint",
    "Call an existing HTTP endpoint",
    {
      machine: z.string().describe("machine serial number"),
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

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd(), "..");

const mcpClient = new Client({
  name: "hbntory-ai-service",
  version: "1.0.0",
});

let connected = false;

export async function connectMcp(): Promise<void> {
  if (connected) {
    return;
  }

  const transport = new StdioClientTransport({
    command: "docker",
    args: [
      "compose",
      "run",
      "--rm",
      "-T",
      "product-mcp-server",
    ],
    cwd: projectRoot,
    stderr: "inherit",
  });

  await mcpClient.connect(transport);

  connected = true;

  console.log("Connexion au Product MCP Server réussie.");
}

export async function listMcpTools() {
  if (!connected) {
    throw new Error("Le serveur MCP n'est pas connecté.");
  }

  const result = await mcpClient.listTools();

  return result.tools;
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<CallToolResult> {
  if (!connected) {
    throw new Error("Le serveur MCP n'est pas connecté.");
  }

  const result = await mcpClient.callTool({
    name,
    arguments: args,
  });

  return result as CallToolResult;
}

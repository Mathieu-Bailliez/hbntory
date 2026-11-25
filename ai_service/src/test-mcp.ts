import { connectMcp, listMcpTools } from "./mcp.js";

async function main() {
  try {
    console.log("Connexion au serveur MCP...");

    await connectMcp();

    const tools = await listMcpTools();

    console.log("\nOutils MCP disponibles :");

    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description ?? "Sans description"}`);
    }

    console.log("\nTest MCP terminé.");
  } catch (error) {
    console.error("Erreur pendant le test MCP :", error);
    process.exitCode = 1;
  }
}

main();

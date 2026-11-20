import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.js";
import {
  ListProductsInput,
  ListProductsOutput,
  GetProductInput,
  GetProductOutput,
} from "./schemas.js";

const server = new McpServer({ name: "product-mcp-server", version: "0.1.0" });

server.registerTool(
  "list_products",
  {
    title: "Lister les produits",
    description:
      "Retourne la liste des produits disponibles (id, nom, prix). " +
      "À utiliser pour découvrir les produits ou trouver un identifiant.",
    inputSchema: ListProductsInput,
    outputSchema: ListProductsOutput,
  },
  async () => {
    // TODO (issue 2) : appeler la Product API
    const result = { products: [], count: 0 };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }
);

server.registerTool(
  "get_product",
  {
    title: "Détails d'un produit",
    description:
      "Retourne les détails d'un produit à partir de son identifiant. " +
      "Retourne une erreur PRODUCT_NOT_FOUND si l'identifiant n'existe pas.",
    inputSchema: GetProductInput,
    outputSchema: GetProductOutput,
  },
  async ({ product_id }) => {
    // TODO (issue 2) : appeler la Product API
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            code: "UNEXPECTED_RESPONSE",
            message: `Non implémenté (product_id=${product_id})`,
          }),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr uniquement : stdout est réservé au protocole MCP
console.error(`product-mcp-server démarré (API: ${config.productApiBaseUrl})`);
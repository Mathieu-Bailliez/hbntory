import { transformProductList } from "./products.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { config } from "./config.js";

import {
  ListProductsInput,
  ListProductsOutput,
  GetProductInput,
  GetProductOutput,
} from "./schemas.js";

// Création du serveur MCP
const server = new McpServer({
  name: "product-mcp-server",
  version: "1.0.0",
});

// Préparation d'une réponse d'erreur MCP
function apiError(code: string, message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ code, message }),
      },
    ],
  };
}

// Appel HTTP à la Product API
async function fetchApi(path: string) {
  try {
    const response = await fetch(
      `${config.productApiBaseUrl}${path}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      return {
        error: apiError(
          response.status === 404 ? "PRODUCT_NOT_FOUND" : "API_UNAVAILABLE",
          `La Product API a répondu avec le statut ${response.status}.`
        ),
      };
    }

    return { data: await response.json() };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return {
        error: apiError("API_TIMEOUT", "La Product API ne répond pas dans le délai imparti."),
      };
    }

    return {
      error: apiError("API_UNAVAILABLE", "Impossible de contacter la Product API."),
    };
  }
}

// Transformation d'un produit vers les champs exposés par MCP
function transformProduct(product: any) {
  return {
    id: String(product.id),
    name: product.name,
    ...(product.description !== undefined && {
      description: product.description,
    }),
    price: Number(product.price),
    ...(product.currency !== undefined && {
      currency: product.currency,
    }),
  };
}

// Outil 1 : list_products
server.registerTool(
  "list_products",
  {
    title: "Lister les produits",
    description: "Permet de récupérer la liste des produits disponibles.",
    inputSchema: ListProductsInput.shape,
    outputSchema: ListProductsOutput.shape,
  },
  async () => {
    const result = await fetchApi("/products");

    if (result.error) {
      return result.error;
    }

    const products = Array.isArray(result.data)
      ? result.data
      : result.data.products;

    if (!Array.isArray(products)) {
      return apiError(
        "UNEXPECTED_RESPONSE",
        "La réponse de la Product API ne contient pas une liste de produits valide."
      );
    }

    const output = transformProductList(products);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(output),
        },
      ],
      structuredContent: output,
    };
  }
);

// Outil 2 : get_product
server.registerTool(
  "get_product",
  {
    title: "Détails d'un produit",
    description:
      "Permet de récupérer les détails d'un produit à partir de son identifiant.",
    inputSchema: GetProductInput.shape,
    outputSchema: GetProductOutput.shape,
  },
  async ({ product_id }) => {
    const id = product_id.trim();

    if (!id) {
      return apiError(
        "INVALID_INPUT",
        "L'identifiant du produit ne peut pas être vide."
      );
    }

    const result = await fetchApi(`/products/${encodeURIComponent(id)}`);

    if (result.error) {
      return result.error;
    }

    const product = result.data.product ?? result.data;

    if (!product || product.id === undefined) {
      return apiError(
        "UNEXPECTED_RESPONSE",
        "La réponse de la Product API ne contient pas de produit valide."
      );
    }

    const output = {
      product: transformProduct(product),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(output),
        },
      ],
      structuredContent: output,
    };
  }
);

// Création du transport STDIO
const transport = new StdioServerTransport();

// Connexion du serveur au transport
await server.connect(transport);

// Message de démarrage
console.error(
  `Product MCP Server démarré - API : ${config.productApiBaseUrl}`
);

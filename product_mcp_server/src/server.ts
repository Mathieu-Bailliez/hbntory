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
  console.error(`[MCP ERROR] ${code}: ${message}`);

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

// Appel HTTP sécurisé à la Product API
async function fetchApi(path: string) {
  let response: Response;

  // Gestion des erreurs de connexion et des timeouts
  try {
    response = await fetch(
      `${config.productApiBaseUrl}${path}`,
      {
        signal: AbortSignal.timeout(10000),
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return {
        error: apiError(
          "API_TIMEOUT",
          "La Product API n'a pas répondu dans les 10 secondes."
        ),
      };
    }

    console.error("[API CONNECTION ERROR]", error);

    return {
      error: apiError(
        "API_UNAVAILABLE",
        "Impossible de se connecter à la Product API. Vérifiez sa disponibilité."
      ),
    };
  }

  // Gestion des réponses HTTP en erreur
  if (!response.ok) {
    console.error(
      `[API HTTP ERROR] ${response.status} ${response.statusText} - ${path}`
    );

    if (
      response.status === 404 &&
      path.startsWith("/api/v1/products/")
    ) {
      return {
        error: apiError(
          "PRODUCT_NOT_FOUND",
          "Le produit demandé n'existe pas."
        ),
      };
    }

    if (response.status >= 500) {
      return {
        error: apiError(
          "API_UNAVAILABLE",
          `La Product API rencontre une erreur serveur (${response.status}).`
        ),
      };
    }

    return {
      error: apiError(
        "API_HTTP_ERROR",
        `La Product API a retourné une erreur HTTP ${response.status}.`
      ),
    };
  }

  // Vérification du JSON retourné
  try {
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("[API JSON ERROR]", error);

    return {
      error: apiError(
        "UNEXPECTED_RESPONSE",
        "La Product API a retourné une réponse JSON invalide."
      ),
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
    price: Number(product.unit_price),
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
    const result = await fetchApi("/api/v1/products");

    if (result.error) {
      return result.error;
    }

    const products = result.data.results;

    if (!Array.isArray(products)) {
      return apiError(
        "UNEXPECTED_RESPONSE",
        "La réponse de la Product API ne contient pas une liste de produits valide."
      );
    }

    const formattedProducts = products.map(transformProduct);

    const output = {
      products: formattedProducts,
      count: formattedProducts.length,
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

    const result = await fetchApi(
      `/api/v1/products/${encodeURIComponent(id)}`
    );

    if (result.error) {
      return result.error;
    }

    const product = result.data;

    if (
      !product ||
      typeof product !== "object" ||
      product.id === undefined ||
      product.name === undefined ||
      product.unit_price === undefined
    ) {
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

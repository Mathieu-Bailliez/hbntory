import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { config } from "./config.js";
import { db, checkDatabaseConnection } from "./database.js";

import {
  ListProductsInput,
  ListProductsOutput,
  GetProductInput,
  GetProductOutput,
  GetProductStockInput,
  GetProductStockOutput,
  GetBranchStockInput,
  GetBranchStockOutput,
} from "./schemas.js";

const server = new McpServer({
  name: "product-mcp-server",
  version: "1.0.0",
});

// Gestion des erreurs MCP
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

// Appel sécurisé à la Product API
async function fetchApi(path: string) {
  let response: Response;

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
      (error.name === "TimeoutError" ||
        error.name === "AbortError")
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
        "Impossible de se connecter à la Product API."
      ),
    };
  }

  if (!response.ok) {
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
          `Erreur serveur Product API (${response.status}).`
        ),
      };
    }

    return {
      error: apiError(
        "API_HTTP_ERROR",
        `Erreur HTTP ${response.status} de la Product API.`
      ),
    };
  }

  try {
    const data = await response.json();
    return { data };
  } catch {
    return {
      error: apiError(
        "UNEXPECTED_RESPONSE",
        "La Product API a retourné un JSON invalide."
      ),
    };
  }
}

// Transformation d'un produit
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
    description: "Récupère la liste des produits disponibles.",
    inputSchema: ListProductsInput.shape,
    outputSchema: ListProductsOutput.shape,
  },
  async () => {
    const result = await fetchApi("/api/v1/products");

    if (result.error) return result.error;

    const products = result.data.results;

    if (!Array.isArray(products)) {
      return apiError(
        "UNEXPECTED_RESPONSE",
        "La réponse ne contient pas une liste de produits valide."
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
    description: "Récupère les détails d'un produit par son identifiant.",
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

    if (result.error) return result.error;

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
        "La Product API n'a pas retourné un produit valide."
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

// Outil 3 : get_product_stock
server.registerTool(
  "get_product_stock",
  {
    title: "Consulter le stock d'un produit",
    description:
      "Récupère les quantités d'un produit dans toutes les agences.",
    inputSchema: GetProductStockInput.shape,
    outputSchema: GetProductStockOutput.shape,
  },
  async ({ product_id }) => {
    const id = Number(product_id);

    try {
      const result = await db.query(
        `SELECT
           b.id AS branch_id,
           b.name AS branch_name,
           s.quantity AS quantity
         FROM stock s
         JOIN branches b ON b.id = s.branch_id
         WHERE s.product_api_id = $1
         ORDER BY b.name`,
        [id]
      );

      const output = {
        product_id: id,
        branches: result.rows.map((row) => ({
          branch_id: row.branch_id,
          branch_name: row.branch_name,
          quantity: row.quantity,
        })),
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
    } catch (error) {
      console.error("[STOCK DATABASE ERROR]", error);

      return apiError(
        "DATABASE_ERROR",
        "Impossible de récupérer le stock du produit."
      );
    }
  }
);

// Outil 4 : get_branch_stock
server.registerTool(
  "get_branch_stock",
  {
    title: "Consulter le stock d'une agence",
    description:
      "Récupère tous les produits et leurs quantités dans une agence à partir de son nom.",
    inputSchema: GetBranchStockInput.shape,
    outputSchema: GetBranchStockOutput.shape,
  },
  async ({ branch_name }) => {
    try {
      const result = await db.query(
        `SELECT
           b.id AS branch_id,
           b.name AS branch_name,
           s.product_api_id AS product_id,
           s.quantity AS quantity
         FROM branches b
         LEFT JOIN stock s ON s.branch_id = b.id
         WHERE LOWER(b.name) = LOWER($1)
         ORDER BY s.product_api_id`,
        [branch_name.trim()]
      );

      if (result.rows.length === 0) {
        return apiError(
          "BRANCH_NOT_FOUND",
          `L'agence "${branch_name}" n'existe pas.`
        );
      }

      const firstRow = result.rows[0];

      const products = result.rows
        .filter((row) => row.product_id !== null)
        .map((row) => ({
          product_id: row.product_id,
          quantity: row.quantity,
        }));

      const output = {
        branch_id: firstRow.branch_id,
        branch_name: firstRow.branch_name,
        products,
        count: products.length,
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
    } catch (error) {
      console.error("[STOCK DATABASE ERROR]", error);

      return apiError(
        "DATABASE_ERROR",
        "Impossible de récupérer le stock de cette agence."
      );
    }
  }
);

// Démarrage du serveur MCP
const transport = new StdioServerTransport();

await checkDatabaseConnection();
await server.connect(transport);

console.error(
  `Product MCP Server démarré - API : ${config.productApiBaseUrl}`
);

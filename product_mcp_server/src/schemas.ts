
import { z } from "zod";

// Structure d'un produit
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  currency: z.string().optional(),
});

// Format commun des erreurs
export const ErrorSchema = z.object({
  code: z.enum([
    "INVALID_INPUT",
    "PRODUCT_NOT_FOUND",
    "API_UNAVAILABLE",
    "API_TIMEOUT",
    "UNEXPECTED_RESPONSE",
    "NOT_IMPLEMENTED",
  ]),
  message: z.string(),
});

// Outil list_products
export const ListProductsInput = z.object({});

export const ListProductsOutput = z.object({
  products: z.array(ProductSchema),
  count: z.number(),
});

// Outil get_product
export const GetProductInput = z.object({
  product_id: z
    .string()
    .trim()
    .min(1)
    .describe("Identifiant unique du produit"),
});

export const GetProductOutput = z.object({
  product: ProductSchema,
});

// Outil get_product_stock
export const GetProductStockInput = z.object({
  product_id: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, "L'identifiant doit être un entier positif")
    .describe("Identifiant numérique du produit dans la Product API"),
});

export const GetProductStockOutput = z.object({
  product_id: z.number(),
  branches: z.array(
    z.object({
      branch_id: z.number(),
      branch_name: z.string(),
      quantity: z.number(),
    })
  ),
});

// Outil get_branch_stock
export const GetBranchStockInput = z.object({
  branch_name: z
    .string()
    .trim()
    .min(1)
    .describe("Nom exact de l'agence, par exemple Paris ou Lyon"),
});

export const GetBranchStockOutput = z.object({
  branch_id: z.number(),
  branch_name: z.string(),
  products: z.array(
    z.object({
      product_id: z.number(),
      quantity: z.number(),
    })
  ),
  count: z.number(),
});

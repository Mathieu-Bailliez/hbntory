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

// Entrée de list_products
export const ListProductsInput = z.object({});

// Sortie de list_products
export const ListProductsOutput = z.object({
  products: z.array(ProductSchema),
  count: z.number(),
});

// Entrée de get_product
export const GetProductInput = z.object({
  product_id: z
    .string()
    .trim()
    .min(1)
    .describe("Identifiant unique du produit"),
});

// Sortie de get_product
export const GetProductOutput = z.object({
  product: ProductSchema,
});
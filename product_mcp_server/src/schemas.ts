import { z } from "zod";

// Produit exposé à l'agent (uniquement le nécessaire)
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  currency: z.string().optional(),
});

// Format d'erreur commun aux deux outils
export const ErrorSchema = z.object({
  code: z.enum([
    "INVALID_INPUT",
    "PRODUCT_NOT_FOUND",
    "API_UNAVAILABLE",
    "API_TIMEOUT",
    "UNEXPECTED_RESPONSE",
  ]),
  message: z.string(),
});

// list_products
export const ListProductsInput = {};
export const ListProductsOutput = {
  products: z.array(ProductSchema),
  count: z.number(),
};

// get_product
export const GetProductInput = {
  product_id: z.string().min(1).describe("Identifiant unique du produit"),
};
export const GetProductOutput = {
  product: ProductSchema,
};
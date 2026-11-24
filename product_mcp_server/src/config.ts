import "dotenv/config";
import process from "node:process";

const productApiBaseUrl =
  process.env.PRODUCT_API_BASE_URL ?? "http://localhost:3000";

export const config = {
  productApiBaseUrl,
};
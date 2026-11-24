import { strict as assert } from "node:assert";
import { transformProductList } from "./products.js";

// Test d'une liste vide
const emptyResult = transformProductList([]);

assert.deepEqual(emptyResult, {
  products: [],
  count: 0,
});

console.log("TEST OK : une liste vide retourne count = 0");

// Test d'une liste contenant un produit
const result = transformProductList([
  {
    id: 1,
    name: "Laptop",
    description: "Ordinateur portable",
    price: 899.99,
  },
]);

assert.equal(result.count, 1);
assert.equal(result.products[0].id, "1");

console.log("TEST OK : la transformation des produits fonctionne");

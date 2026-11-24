export function transformProductList(products: any[]) {
  const formattedProducts = products.map((product) => ({
    id: String(product.id),
    name: product.name,
    ...(product.description !== undefined && {
      description: product.description,
    }),
    price: Number(product.price),
    ...(product.currency !== undefined && {
      currency: product.currency,
    }),
  }));

  return {
    products: formattedProducts,
    count: formattedProducts.length,
  };
}

import { listProducts } from "@/services/server-api";
import BestProductsCarousel from "./BestProductsCarousel";

export default async function BestProducts() {
  const products = await listProducts({
    limit: 12,
    isActive: true,
  })
    .then((response) => response.data)
    .catch(() => []);

  return <BestProductsCarousel products={products} />;
}

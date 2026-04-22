import { ProductDetailView } from "./product-detail-view";

export default async function BuyerProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductDetailView productId={productId} />;
}

import OrderDetailClient from "./OrderDetailClient";

export function generateStaticParams() {
  return [];
}

export default function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  return <OrderDetailClient orderNumber={params.orderNumber} />;
}

import OrderDetailClient from "./OrderDetailClient";

export async function generateStaticParams() {
  // Export mode requires a concrete param list for dynamic segments.
  // We cannot know user-specific order numbers at build time, so provide a placeholder page.
  return [{ orderNumber: "__no_orders__" }];
}

export const dynamicParams = false;

export default async function OrderDetailPage(props: {
  params: Promise<{ orderNumber: string }>;
}) {
  const params = await props.params;
  return <OrderDetailClient orderNumber={params.orderNumber} />;
}

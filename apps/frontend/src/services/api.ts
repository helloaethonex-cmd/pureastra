const BASE = process.env.NEXT_PUBLIC_BACKEND_URL + "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  children?: Category[];
}

export interface ProductVariant {
  id: string;
  variantName?: string | null;
  sku?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  isActive: boolean;
}

export interface ProductVariantDetail {
  id: string;
  variantName?: string | null;
  sku?: string | null;
  price?: number | null;
  costPrice?: number | null;
  stockQuantity?: number | null;
  reservedQuantity?: number | null;
  weight?: number | null;
  isActive: boolean;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  position?: number | null;
  variantId?: string | null;
}

export type ProductContentSectionType =
  | "BENEFITS"
  | "FAQ"
  | "SUITABLE_FOR"
  | "USAGE_INSTRUCTION"
  | "BEFORE_AFTER"
  | "INGREDIENTS"
  | "HIGHLIGHTS"
  | "CUSTOM";

export interface ProductContentSection {
  id?: string;
  productId?: string;
  sectionType: ProductContentSectionType;
  title?: string | null;
  content: unknown;
  position: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  isActive: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  contentSections?: ProductContentSection[];
  categories?: { category: Category }[];
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserRole {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  publicId: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  role?: UserRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  addressType?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  images?: ProductImage[];
}

export interface CartVariantImage {
  id: string;
  imageUrl?: string | null;
}

export interface CartProductVariant {
  id: string;
  variantName?: string | null;
  price?: number | string | null;
  product: CartProduct;
  images?: CartVariantImage[];
}

export interface CartItem {
  id: string;
  quantity: number;
  priceSnapshot?: number | string | null;
  productVariant: CartProductVariant;
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  status: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

const GUEST_CART_SESSION_KEY = "pureastra_guest_cart_session_id";
const CART_MERGE_ROUTE_UNAVAILABLE_KEY = "pureastra_cart_merge_route_unavailable";

const getGuestCartSessionId = (
  options?: { createIfMissing?: boolean },
): string | null => {
  if (typeof window === "undefined") return null;

  const existing = window.localStorage.getItem(GUEST_CART_SESSION_KEY);
  if (existing) return existing;
  if (options?.createIfMissing === false) return null;

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(GUEST_CART_SESSION_KEY, generated);
  return generated;
};

const clearGuestCartSessionId = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_CART_SESSION_KEY);
};

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  orderStatus: number;
  paymentStatus: number;
  totalPaid: string;
  createdAt: string;
}

export interface OrderDetailItem {
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  price: string;
}

export interface OrderDetailPayment {
  amount: string;
  status: number;
  method: string | null;
  createdAt: string;
}

export interface OrderDetailStatusHistory {
  oldStatus: number | null;
  newStatus: number;
  note: string | null;
  createdAt: string;
}

export interface OrderShippingAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderDetailResponse {
  orderNumber: string;
  orderStatus: number;
  paymentStatus: number;
  productTotal: string;
  shippingAmount: string;
  taxAmount: string;
  discountAmount: string;
  totalPaid: string;
  shippingAddress: OrderShippingAddress;
  placedAt: string | null;
  createdAt: string;
  items: OrderDetailItem[];
  payments: OrderDetailPayment[];
  statusHistory: OrderDetailStatusHistory[];
}

export interface InvoiceItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface OrderInvoiceResponse {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: number;
  pdfStatus: number;
  issuedAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string | null;
  sellerState: string;
  productTotal: string;
  shippingAmount: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  cgst: string | null;
  sgst: string | null;
  igst: string | null;
  pdfUrl: string | null;
  createdAt: string;
  items: InvoiceItem[];
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  orderStatus: number;
  paymentStatus: number;
  totalPaid: string;
  createdAt: string;
}

export interface PaginatedOrdersResponse {
  data: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  userId: string;
  orderStatus: number;
  paymentStatus: number;
  totalPaid: string;
  createdAt: string;
}

export interface AdminPaginatedOrdersResponse {
  data: AdminOrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  paymentProvider: string;
  amount: string;
  currency: string;
  paymentStatus: number;
  paymentAttemptId: string;
  razorpayOrderId: string | null;
  amountPaise: number;
  razorpayKeyId: string;
  createdAt: string;
}

export interface CheckoutPreviewLineItem {
  productVariantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface CheckoutPreviewResponse {
  flowType: "cart" | "buy_now";
  items: CheckoutPreviewLineItem[];
  totals: {
    productTotal: string;
    shippingAmount: string;
    taxAmount: string;
    discountAmount: string;
    grandTotal: string;
    outstandingAmount: string;
  };
  couponStatus: "NOT_IMPLEMENTED";
  couponDiscountAmount: "0.00";
  couponMessage: string;
  previewToken: string;
  expiresAt: string;
}

export interface CheckoutConfirmResponse {
  order: CreatedOrder;
  payment: PaymentAttempt;
  coupon: {
    couponStatus: "NOT_IMPLEMENTED";
    couponDiscountAmount: "0.00";
    couponMessage: string;
  };
}

export interface WishlistProduct {
  id: string;
  uuid?: string;
  name: string;
  slug?: string | null;
  brand?: string | null;
}

export interface WishlistVariantImage {
  id: string;
  imageUrl?: string | null;
  position?: number | null;
}

export interface WishlistProductVariant {
  id: string;
  variantName?: string | null;
  sku?: string | null;
  price?: number | string | null;
  product: WishlistProduct;
  images?: WishlistVariantImage[];
}

export interface WishlistItem {
  id: string;
  userId: string;
  productVariantId: string;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
  productVariant: WishlistProductVariant;
}

export interface ReviewMetric {
  id: string;
  name: string;
  icon: string | null;
  minValue: number;
  maxValue: number;
  unit: "PERCENT" | "RATING";
  displayOrder: number;
}

export interface ReviewMetricValue {
  metricId: string;
  name: string;
  icon: string | null;
  unit: "PERCENT" | "RATING";
  value: number;
}

export interface ProductReview {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  user: {
    name: string;
    image?: string | null;
  };
  images: Array<{
    id: string;
    imageUrl: string;
  }>;
  metrics: ReviewMetricValue[];
  createdAt: string;
}

export interface ProductReviewListResponse {
  data: ProductReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductReviewSummary {
  totalReviews: number;
  avgRating: number;
  metrics: Array<{
    metricId: string;
    name: string;
    icon: string | null;
    average: number;
  }>;
}

export interface ReviewEligibility {
  hasPurchased: boolean;
  hasReviewed: boolean;
  canReview: boolean;
}

export interface InfluencerReferralValidationResponse {
  valid: boolean;
  name?: string;
  referralCode?: string;
}

export interface InfluencerDashboardSale {
  id: string;
  orderId: string;
  orderNumber: string;
  commissionAmount: string;
  status: "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
  orderTotal: string;
  createdAt: string;
}

export interface InfluencerDashboardResponse {
  influencer: {
    id: string;
    name: string;
    referralCode: string;
    commissionRate: string;
    status: "ACTIVE" | "PAUSED" | "BANNED";
  };
  earnings: {
    total: string;
    pending: string;
    approved: string;
    paid: string;
  };
  orders: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    cancelled: number;
  };
  recentSales: InfluencerDashboardSale[];
}

export interface AdminReportOverviewResponse {
  from: string | null;
  to: string | null;
  totalRevenue: string;
  totalGST: string;
  shippingRevenue: string;
  discounts: string;
  influencerCommission: string;
  profit: string;
}

export interface AdminGstSummaryResponse {
  type: "summary";
  from: string;
  to: string;
  totalInvoices: number;
  totalTaxableValue: string;
  totalGST: string;
  totalCGST: string;
  totalSGST: string;
  totalIGST: string;
}

export interface AdminGstDetailedRow {
  invoiceNumber: string;
  issuedAt: string;
  customerState: string;
  taxableValue: string;
  gstRate: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalAmount: string;
}

export interface AdminGstDetailedResponse {
  type: "detailed";
  from: string;
  to: string;
  sort: "issuedAt:asc" | "issuedAt:desc";
  rows: AdminGstDetailedRow[];
  totals: {
    taxableValue: string;
    cgst: string;
    sgst: string;
    igst: string;
  };
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
  };
}

export type AdminInfluencerStatus = "ACTIVE" | "PAUSED" | "BANNED";

export interface AdminInfluencer {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  commissionRate: string;
  totalEarnings: string;
  canViewDashboard: boolean;
  status: AdminInfluencerStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminInfluencerListResponse {
  data: AdminInfluencer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminInfluencerAnalyticsResponse {
  revenue: {
    totalInfluencedOrderValue: string;
    totalCommissionIssued: string;
    totalCommissionPaid: string;
    totalCommissionPending: string;
    totalCommissionApproved: string;
  };
  influencers: {
    total: number;
    active: number;
    paused: number;
    banned: number;
  };
  dateFilter: {
    startDate: string | null;
    endDate: string | null;
  };
  topInfluencers: Array<{
    id: string;
    name: string;
    referralCode: string;
    totalEarnings: string;
    status: AdminInfluencerStatus;
    totalOrders: number;
  }>;
}

export interface AdminInfluencerPayout {
  id: string;
  amount: string;
  status: "INITIATED" | "COMPLETED" | "FAILED";
  referenceNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInfluencerPayoutListResponse {
  data: AdminInfluencerPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const listCategories = () =>
  apiFetch<Category[]>("/products/categories");

export const getCategory = (id: string) =>
  apiFetch<Category>(`/products/categories/${id}`);

export const createCategory = (body: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}) =>
  apiFetch<Category>("/products/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateCategory = (
  id: string,
  body: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string;
  }
) =>
  apiFetch<Category>(`/products/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteCategory = (id: string) =>
  apiFetch<void>(`/products/categories/${id}`, {
    method: "DELETE",
  });

// ─── Products ─────────────────────────────────────────────────────────────────

export const listProducts = (params: ProductListParams = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.set(k, String(v));
  });
  return apiFetch<ProductListResponse>(`/products?${q.toString()}`);
};

export const getProductBySlug = (slug: string) =>
  apiFetch<Product>(`/products/slug/${slug}`);

export const createProduct = (body: {
  name: string;
  slug?: string;
  description?: string;
  brand?: string;
  isActive?: boolean;
  categoryIds?: string[];
  variants?: {
    variantName?: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
  }[];
}) =>
  apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateProduct = (
  id: string,
  body: {
    name?: string;
    slug?: string;
    description?: string;
    brand?: string;
    isActive?: boolean;
  }
) =>
  apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteProduct = (id: string) =>
  apiFetch<void>(`/products/${id}`, {
    method: "DELETE",
  });

export const addProductImage = (
  productId: string,
  body: { imageUrl: string; position?: number; variantId?: string }
) =>
  apiFetch<ProductImage>(`/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const deleteProductImage = (productId: string, imageId: string) =>
  apiFetch<void>(`/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });

export const setProductImagePosition = async (
  productId: string,
  image: { id: string; imageUrl: string; variantId?: string | null },
  position: number,
) => {
  const created = await addProductImage(productId, {
    imageUrl: image.imageUrl,
    variantId: image.variantId ?? undefined,
    position,
  });

  await deleteProductImage(productId, image.id);
  return created;
};

export const setProductCoverImage = async (
  productId: string,
  image: { id: string; imageUrl: string; variantId?: string | null },
) => setProductImagePosition(productId, image, 0);

export const assignProductCategories = (
  productId: string,
  categoryIds: string[],
) =>
  apiFetch<Array<{ id: string; productId: string; categoryId: string }>>(
    `/products/${productId}/categories`,
    {
      method: "POST",
      body: JSON.stringify({ categoryIds }),
    },
  );

export const removeProductCategory = (productId: string, categoryId: string) =>
  apiFetch<{ message: string }>(`/products/${productId}/categories/${categoryId}`, {
    method: "DELETE",
  });

export const addProductVariant = (
  productId: string,
  body: {
    variantName?: string;
    sku?: string;
    price?: number;
    costPrice?: number;
    stockQuantity?: number;
    reservedQuantity?: number;
    weight?: number;
    isActive?: boolean;
  },
) =>
  apiFetch<ProductVariantDetail>(`/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateProductVariant = (
  productId: string,
  variantId: string,
  body: {
    variantName?: string;
    sku?: string;
    price?: number;
    costPrice?: number;
    stockQuantity?: number;
    reservedQuantity?: number;
    weight?: number;
    isActive?: boolean;
  },
) =>
  apiFetch<ProductVariantDetail>(`/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteProductVariant = (productId: string, variantId: string) =>
  apiFetch<{ message: string }>(`/products/${productId}/variants/${variantId}`, {
    method: "DELETE",
  });

export const adjustProductVariantStock = (
  productId: string,
  variantId: string,
  body: { quantity: number; reason?: string },
) =>
  apiFetch<ProductVariantDetail>(`/products/${productId}/variants/${variantId}/stock`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const listProductContentSectionsAdmin = (productId: string) =>
  apiFetch<ProductContentSection[]>(`/products/${productId}/content-sections/admin`);

export const createProductContentSection = (
  productId: string,
  body: {
    sectionType: ProductContentSectionType;
    title?: string;
    content: unknown;
    position?: number;
    isActive?: boolean;
  },
) =>
  apiFetch<ProductContentSection>(`/products/${productId}/content-sections`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateProductContentSection = (
  productId: string,
  sectionId: string,
  body: {
    sectionType?: ProductContentSectionType;
    title?: string;
    content?: unknown;
    position?: number;
    isActive?: boolean;
  },
) =>
  apiFetch<ProductContentSection>(`/products/${productId}/content-sections/${sectionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteProductContentSection = (productId: string, sectionId: string) =>
  apiFetch<{ message: string }>(`/products/${productId}/content-sections/${sectionId}`, {
    method: "DELETE",
  });

// ─── Upload ───────────────────────────────────────────────────────────────────

export const uploadImageToR2 = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE}/upload/image`, {
    method: "POST",
    credentials: "include",
    body: formData,
    // NOTE: Do NOT set Content-Type header — browser will set it with boundary
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Upload failed ${res.status}`);
  }

  const data = await res.json();
  return data.url as string;
};

export const uploadReviewImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE}/upload/review-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Upload failed ${res.status}`);
  }

  const data = await res.json();
  return data.url as string;
};

// ─── Admin check ──────────────────────────────────────────────────────────────

export const checkAdminAccess = async (): Promise<boolean> => {
  const res = await fetch(`${BASE}/users/admin`, {
    credentials: "include",
  });
  return res.ok; // 200 = admin, 403 = not admin
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getMyProfile = () => apiFetch<UserProfile>("/users/me");

export const updateMyProfile = (body: {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}) =>
  apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ─── Addresses ────────────────────────────────────────────────────────────────

export const listMyAddresses = () => apiFetch<Address[]>("/addresses");

export const createAddress = (body: {
  addressType?: "SHIPPING" | "BILLING" | "BOTH";
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}) =>
  apiFetch<Address>("/addresses", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ─── Orders + Payments (Checkout) ─────────────────────────────────────────────

export const previewCheckout = (body: {
  addressId: string;
  note?: string;
  couponCode?: string;
  referralCode?: string;
}) =>
  apiFetch<CheckoutPreviewResponse>("/checkout/preview", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const confirmCheckout = (
  body: { previewToken: string },
  idempotencyKey: string,
) =>
  apiFetch<CheckoutConfirmResponse>("/checkout/confirm", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

export const previewBuyNowCheckout = (body: {
  productVariantId: string;
  quantity: number;
  addressId: string;
  note?: string;
  couponCode?: string;
  referralCode?: string;
}) =>
  apiFetch<CheckoutPreviewResponse>("/checkout/buy-now/preview", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const confirmBuyNowCheckout = (
  body: { previewToken: string },
  idempotencyKey: string,
) =>
  apiFetch<CheckoutConfirmResponse>("/checkout/buy-now/confirm", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

export const createOrder = (body: { addressId: string; note?: string }) =>
  apiFetch<CreatedOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const validateInfluencerReferral = (code: string) =>
  apiFetch<InfluencerReferralValidationResponse>(
    `/influencers/validate-ref?code=${encodeURIComponent(code)}`,
  );

export const getMyInfluencerDashboard = () =>
  apiFetch<InfluencerDashboardResponse>("/influencers/me/dashboard");

export const getOrderDetail = (orderNumber: string) =>
  apiFetch<OrderDetailResponse>(`/orders/${orderNumber}`);

export const getOrderInvoice = (orderNumber: string) =>
  apiFetch<OrderInvoiceResponse>(`/orders/${orderNumber}/invoice`);

export const getAdminOrderInvoice = (orderNumber: string) =>
  apiFetch<OrderInvoiceResponse>(`/admin/orders/${orderNumber}/invoice`);

export const regenerateAdminInvoicePdf = (
  orderNumber: string,
  force = false,
) =>
  apiFetch<{ message: string; invoiceNumber: string; force: boolean }>(
    `/admin/orders/${orderNumber}/invoice/regenerate-pdf${force ? "?force=true" : ""}`,
    {
      method: "POST",
    },
  );

// Alias for explicit full-detail fetching
export const getFullOrderDetail = getOrderDetail;

export const listMyOrders = (params?: { page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString();
  return apiFetch<PaginatedOrdersResponse>(`/orders${suffix ? `?${suffix}` : ""}`);
};

export const createOrderPaymentAttempt = (
  orderId: string,
  body: {
    paymentProvider?: string;
    paymentMethod?: string;
  },
  idempotencyKey: string,
) =>
  apiFetch<PaymentAttempt>(`/orders/${orderId}/payments`, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

export const verifyRazorpayPayment = (
  paymentId: string,
  body: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
) =>
  apiFetch(`/payments/${paymentId}/razorpay/verify`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const listAdminOrders = (params?: {
  page?: number;
  limit?: number;
  orderStatus?: number;
  paymentStatus?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (typeof params?.orderStatus === "number") q.set("orderStatus", String(params.orderStatus));
  if (typeof params?.paymentStatus === "number") q.set("paymentStatus", String(params.paymentStatus));
  if (params?.search) q.set("search", params.search);
  if (params?.sortOrder) q.set("sortOrder", params.sortOrder);
  const suffix = q.toString();
  return apiFetch<{
    data: Array<{
      id: string;
      orderNumber: string;
      userId: string;
      orderStatus: number;
      paymentStatus: number;
      totalPaid: string;
      createdAt: string;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/admin/orders${suffix ? `?${suffix}` : ""}`);
};

export const updateAdminOrderStatus = (
  orderNumber: string,
  body: { newStatus: number; note?: string },
) =>
  apiFetch(`/admin/orders/${orderNumber}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ─── Shipping Labels ───────────────────────────────────────────────────────────

/**
 * Download a single shipping label PDF for one order.
 * Uses raw fetch (not apiFetch) because the response is a binary PDF, not JSON.
 */
export const downloadSingleShippingLabel = async (orderId: string): Promise<void> => {
  const res = await fetch(`${BASE}/admin/orders/${orderId}/shipping-label`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Failed to download label (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shipping-label-${orderId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Download bulk shipping labels PDF for multiple orders.
 * Uses raw fetch (not apiFetch) because the response is a binary PDF, not JSON.
 */
export const downloadBulkShippingLabels = async (orderIds: string[]): Promise<void> => {
  const res = await fetch(`${BASE}/admin/orders/shipping-labels`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds: orderIds.map(Number) }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Failed to download bulk labels (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shipping-labels-bulk.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─── Admin Reports ──────────────────────────────────────────────────────────

export const getAdminOverviewReport = (params?: {
  from?: string;
  to?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const suffix = q.toString();
  return apiFetch<AdminReportOverviewResponse>(
    `/admin/reports/overview${suffix ? `?${suffix}` : ""}`,
  );
};

export const getAdminGstReportSummary = (params: {
  from: string;
  to: string;
  sort?: "issuedAt:asc" | "issuedAt:desc";
}) => {
  const q = new URLSearchParams();
  q.set("from", params.from);
  q.set("to", params.to);
  q.set("type", "summary");
  if (params.sort) q.set("sort", params.sort);
  return apiFetch<AdminGstSummaryResponse>(`/admin/reports/gst?${q.toString()}`);
};

export const getAdminGstReportDetailed = (params: {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  sort?: "issuedAt:asc" | "issuedAt:desc";
}) => {
  const q = new URLSearchParams();
  q.set("from", params.from);
  q.set("to", params.to);
  q.set("type", "detailed");
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.sort) q.set("sort", params.sort);
  return apiFetch<AdminGstDetailedResponse>(`/admin/reports/gst?${q.toString()}`);
};

export const downloadAdminGstReportCsv = async (params: {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  sort?: "issuedAt:asc" | "issuedAt:desc";
  exportAll?: boolean;
}) => {
  const q = new URLSearchParams();
  q.set("from", params.from);
  q.set("to", params.to);
  q.set("type", "detailed");
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.sort) q.set("sort", params.sort);
  q.set("exportAll", String(Boolean(params.exportAll)));

  const res = await fetch(`${BASE}/admin/reports/gst/export?${q.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}`);
  }

  return res.blob();
};

// ─── Admin Influencers ──────────────────────────────────────────────────────

export const listAdminInfluencers = (params?: {
  page?: number;
  limit?: number;
  status?: AdminInfluencerStatus;
  sortOrder?: "asc" | "desc";
}) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  if (params?.sortOrder) q.set("sortOrder", params.sortOrder);
  const suffix = q.toString();
  return apiFetch<AdminInfluencerListResponse>(
    `/admin/influencers${suffix ? `?${suffix}` : ""}`,
  );
};

export const createAdminInfluencer = (body: {
  name: string;
  email: string;
  referralCode: string;
  commissionRate: number;
}) =>
  apiFetch<AdminInfluencer>("/admin/influencers", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateAdminInfluencerStatus = (
  influencerId: string,
  body: { status: AdminInfluencerStatus },
) =>
  apiFetch<AdminInfluencer>(`/admin/influencers/${influencerId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const updateAdminInfluencerCommission = (
  influencerId: string,
  body: { commissionRate: number },
) =>
  apiFetch<AdminInfluencer>(`/admin/influencers/${influencerId}/commission`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const updateAdminInfluencerDashboardAccess = (
  influencerId: string,
  body: { canViewDashboard: boolean },
) =>
  apiFetch<AdminInfluencer>(`/admin/influencers/${influencerId}/dashboard-access`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const getAdminInfluencerAnalytics = (params?: {
  topLimit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const q = new URLSearchParams();
  if (typeof params?.topLimit === "number") q.set("topLimit", String(params.topLimit));
  if (params?.startDate) q.set("startDate", params.startDate);
  if (params?.endDate) q.set("endDate", params.endDate);
  const suffix = q.toString();
  return apiFetch<AdminInfluencerAnalyticsResponse>(
    `/admin/influencers/analytics${suffix ? `?${suffix}` : ""}`,
  );
};

export const listAdminInfluencerPayouts = (
  influencerId: string,
  params?: { page?: number; limit?: number },
) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString();
  return apiFetch<AdminInfluencerPayoutListResponse>(
    `/admin/influencers/${influencerId}/payouts${suffix ? `?${suffix}` : ""}`,
  );
};

export const recordAdminInfluencerPayout = (
  influencerId: string,
  body: { amount: number; referenceNote?: string },
) =>
  apiFetch<{
    id: string;
    influencerId: string;
    amount: string;
    status: string;
    referenceNote: string | null;
    createdAt: string;
  }>(`/admin/influencers/${influencerId}/payouts`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateAdminInfluencerPayoutStatus = (
  payoutId: string,
  body: { status: "COMPLETED" | "FAILED"; referenceNote?: string },
) =>
  apiFetch<{
    id: string;
    status: string;
    referenceNote: string | null;
    updatedAt: string;
  }>(`/admin/influencers/payouts/${payoutId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getCart = () => apiFetch<Cart>("/cart");

type CartRequestOptions = {
  includeGuestSession?: boolean;
};

const cartSessionHeaders = (options?: CartRequestOptions) => {
  if (options?.includeGuestSession === false) return undefined;
  const sessionId = getGuestCartSessionId();
  return sessionId ? { "x-session-id": sessionId } : undefined;
};

export const getCartWithGuestSession = async (options?: CartRequestOptions) => {
  const sessionId =
    options?.includeGuestSession === false
      ? null
      : getGuestCartSessionId();
  return apiFetch<Cart>(`/cart${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`);
};

export const addCartItem = (
  body: { productVariantId: string; quantity: number },
  options?: CartRequestOptions,
) =>
  apiFetch<CartItem>("/cart/items", {
    method: "POST",
    headers: cartSessionHeaders(options),
    body: JSON.stringify(body),
  });

export const updateCartItemQuantity = (
  itemId: string,
  quantity: number,
  options?: CartRequestOptions,
) =>
  apiFetch<CartItem>(`/cart/items/${itemId}`, {
    method: "PATCH",
    headers: cartSessionHeaders(options),
    body: JSON.stringify({ quantity }),
  });

export const removeCartItem = (itemId: string, options?: CartRequestOptions) =>
  apiFetch<{ message: string }>(`/cart/items/${itemId}`, {
    method: "DELETE",
    headers: cartSessionHeaders(options),
  });

export const clearCart = (options?: CartRequestOptions) =>
  apiFetch<{ message: string }>("/cart", {
    method: "DELETE",
    headers: cartSessionHeaders(options),
  });

export const mergeGuestCart = async () => {
  const sessionId = getGuestCartSessionId({ createIfMissing: false });
  if (!sessionId) return null;

  if (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(CART_MERGE_ROUTE_UNAVAILABLE_KEY) === "1"
  ) {
    return null;
  }

  try {
    const merged = await apiFetch<Cart>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(CART_MERGE_ROUTE_UNAVAILABLE_KEY);
    }

    clearGuestCartSessionId();
    return merged;
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    if (msg.includes("404")) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(CART_MERGE_ROUTE_UNAVAILABLE_KEY, "1");
      }
      return null;
    }
    throw err;
  }
};

// ─── Wishlist ────────────────────────────────────────────────────────────────

export const getWishlist = () => apiFetch<WishlistItem[]>("/wishlist");

export const addWishlistItem = (body: { productVariantId: string }) =>
  apiFetch<WishlistItem>("/wishlist/items", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const removeWishlistItem = (productVariantId: string) =>
  apiFetch<{ message: string }>(`/wishlist/items/${productVariantId}`, {
    method: "DELETE",
  });

export const moveWishlistItemToCart = (productVariantId: string) =>
  apiFetch<{ message: string }>(`/wishlist/items/${productVariantId}/move-to-cart`, {
    method: "POST",
  });

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const getProductReviews = (productId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: "newest" | "highest" | "lowest";
}) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.sortBy) q.set("sortBy", params.sortBy);
  const suffix = q.toString();
  return apiFetch<ProductReviewListResponse>(
    `/reviews/products/${productId}${suffix ? `?${suffix}` : ""}`,
  );
};

export const getProductReviewSummary = (productId: string) =>
  apiFetch<ProductReviewSummary>(`/reviews/products/${productId}/summary`);

export const getProductReviewMetrics = (productId: string) =>
  apiFetch<ReviewMetric[]>(`/reviews/products/${productId}/metrics`);

export const getReviewEligibility = (productId: string) =>
  apiFetch<ReviewEligibility>(`/reviews/products/${productId}/eligibility`);

export const createProductReview = (body: {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  metrics?: Array<{
    metricId: string;
    value: number;
  }>;
}) =>
  apiFetch<ProductReview>("/reviews", {
    method: "POST",
    body: JSON.stringify(body),
  });

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL + "/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
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
  sectionType: ProductContentSectionType;
  title?: string | null;
  content: unknown;
  position: number;
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

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  orderStatus: number;
  paymentStatus: number;
  totalPaid: string;
  createdAt: string;
}

export interface OrderDetailResponse {
  orderNumber: string;
  orderStatus: number;
  paymentStatus: number;
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

// ─── Admin check ──────────────────────────────────────────────────────────────

export const checkAdminAccess = async (): Promise<boolean> => {
  const res = await fetch(`${BASE}/users/admin`, {
    credentials: "include",
  });
  return res.ok; // 200 = admin, 403 = not admin
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getMyProfile = () => apiFetch<UserProfile>("/users/me");

// ─── Addresses ────────────────────────────────────────────────────────────────

export const listMyAddresses = () => apiFetch<Address[]>("/addresses");

// ─── Orders + Payments (Checkout) ─────────────────────────────────────────────

export const createOrder = (body: { addressId: string; note?: string }) =>
  apiFetch<CreatedOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getOrderDetail = (orderNumber: string) =>
  apiFetch<OrderDetailResponse>(`/orders/${orderNumber}`);

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
  return apiFetch<AdminPaginatedOrdersResponse>(`/admin/orders${suffix ? `?${suffix}` : ""}`);
};

export const updateAdminOrderStatus = (
  orderNumber: string,
  body: { newStatus: number; note?: string },
) =>
  apiFetch(`/admin/orders/${orderNumber}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getCart = () => apiFetch<Cart>("/cart");

export const addCartItem = (body: { productVariantId: string; quantity: number }) =>
  apiFetch<CartItem>("/cart/items", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateCartItemQuantity = (itemId: string, quantity: number) =>
  apiFetch<CartItem>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });

export const removeCartItem = (itemId: string) =>
  apiFetch<{ message: string }>(`/cart/items/${itemId}`, {
    method: "DELETE",
  });

export const clearCart = () =>
  apiFetch<{ message: string }>("/cart", {
    method: "DELETE",
  });

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

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  checkAdminAccess,
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  uploadImageToR2,
  listAdminOrders,
  updateAdminOrderStatus,
} from "@/services/api";

// ─── Admin check ──────────────────────────────────────────────────────────────

export function useIsAdmin() {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: checkAdminAccess,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      slug?: string;
      description?: string;
      parentId?: string;
    }) => createCategory(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      parentId?: string;
    }) => updateCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
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
    }) => createProduct(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      brand?: string;
      isActive?: boolean;
    }) => updateProduct(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ─── Images ───────────────────────────────────────────────────────────────────

export function useAddProductImage(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      position,
      variantId,
    }: {
      file: File;
      position?: number;
      variantId?: string;
    }) => {
      const imageUrl = await uploadImageToR2(file);
      return addProductImage(productId, { imageUrl, position, variantId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      imageId,
    }: {
      productId: string;
      imageId: string;
    }) => deleteProductImage(productId, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useAdminOrders(params?: {
  page?: number;
  limit?: number;
  orderStatus?: number;
  paymentStatus?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["adminOrders", params],
    queryFn: () => listAdminOrders(params),
    staleTime: 1000 * 30,
  });
}

export function useUpdateAdminOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      newStatus,
      note,
    }: {
      orderNumber: string;
      newStatus: number;
      note?: string;
    }) => updateAdminOrderStatus(orderNumber, { newStatus, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminOrders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

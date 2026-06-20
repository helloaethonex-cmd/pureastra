"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAdminInfluencer,
  checkAdminAccess,
  createCategory,
  downloadAdminGstReportCsv,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  uploadImageToR2,
  getAdminOverviewReport,
  getAdminGstReportSummary,
  getAdminGstReportDetailed,
  getAdminInfluencerAnalytics,
  listAdminInfluencers,
  listAdminOrders,
  listAdminInfluencerPayouts,
  recordAdminInfluencerPayout,
  updateAdminInfluencerCommission,
  updateAdminInfluencerDashboardAccess,
  updateAdminInfluencerPayoutStatus,
  updateAdminInfluencerStatus,
  updateAdminOrderStatus,
  downloadSingleShippingLabel,
  downloadBulkShippingLabels,
  listManualInvoices,
  createManualInvoice,
  updateManualInvoice,
  type CreateManualInvoicePayload,
  listVendors,
  createVendor,
  updateVendor,
  createWholesaleInvoice,
  listWholesaleInvoices,
  regenerateWholesaleInvoicePdf,
  getWholesaleReport,
  type VendorPayload,
  type CreateWholesaleInvoicePayload,
} from "@/services/api";

// ─── Admin check ──────────────────────────────────────────────────────────────

export function useIsAdmin(enabled = true) {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: checkAdminAccess,
    enabled,
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
      discountEndsAt?: string | null;
      isActive?: boolean;
      categoryIds?: string[];
      variants?: {
        variantName?: string;
        sku?: string;
        price?: number;
        mrp?: number;
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
      discountEndsAt?: string | null;
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
      const uploaded = await uploadImageToR2(file);
      return addProductImage(productId, {
        imageUrl: uploaded.url,
        heroImageUrl: uploaded.heroImageUrl,
        thumbnailImageUrl: uploaded.thumbnailImageUrl,
        width: uploaded.width,
        height: uploaded.height,
        placeholder: uploaded.placeholder,
        position,
        variantId,
      });
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

// ─── Shipping Labels ───────────────────────────────────────────────────────────

export function useDownloadShippingLabel() {
  return useMutation({
    mutationFn: (orderId: string) => downloadSingleShippingLabel(orderId),
  });
}

export function useDownloadBulkShippingLabels() {
  return useMutation({
    mutationFn: (orderIds: string[]) => downloadBulkShippingLabels(orderIds),
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function useAdminOverviewReport(params?: {
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ["adminReports", "overview", params],
    queryFn: () => getAdminOverviewReport(params),
    staleTime: 1000 * 30,
  });
}

export function useAdminGstSummary(params: {
  from: string;
  to: string;
  sort?: "issuedAt:asc" | "issuedAt:desc";
}) {
  return useQuery({
    queryKey: ["adminReports", "gst", "summary", params],
    queryFn: () => getAdminGstReportSummary(params),
    enabled: Boolean(params.from && params.to),
    staleTime: 1000 * 30,
  });
}

export function useAdminGstDetailed(params: {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  sort?: "issuedAt:asc" | "issuedAt:desc";
}) {
  return useQuery({
    queryKey: ["adminReports", "gst", "detailed", params],
    queryFn: () => getAdminGstReportDetailed(params),
    enabled: Boolean(params.from && params.to),
    staleTime: 1000 * 30,
  });
}

export function useDownloadAdminGstCsv() {
  return useMutation({
    mutationFn: (params: {
      from: string;
      to: string;
      page?: number;
      limit?: number;
      sort?: "issuedAt:asc" | "issuedAt:desc";
      exportAll?: boolean;
    }) => downloadAdminGstReportCsv(params),
  });
}

// ─── Manual Invoices ─────────────────────────────────────────────────────────

export function useManualInvoices(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["manualInvoices", params],
    queryFn: () => listManualInvoices(params),
    staleTime: 1000 * 30,
  });
}

export function useCreateManualInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateManualInvoicePayload) => createManualInvoice(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manualInvoices"] }),
  });
}

export function useUpdateManualInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateManualInvoicePayload }) =>
      updateManualInvoice(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manualInvoices"] }),
  });
}

// ─── Vendors (Wholesale) ───────────────────────────────────────────────────

export function useVendors(params?: {
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "INACTIVE";
}) {
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => listVendors(params),
    staleTime: 1000 * 30,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: VendorPayload) => createVendor(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: VendorPayload }) => updateVendor(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useCreateWholesaleInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, body }: { vendorId: string; body: CreateWholesaleInvoicePayload }) =>
      createWholesaleInvoice(vendorId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wholesaleInvoices"] }),
  });
}

export function useWholesaleInvoices(params?: {
  page?: number;
  limit?: number;
  vendorId?: string;
}) {
  return useQuery({
    queryKey: ["wholesaleInvoices", params],
    queryFn: () => listWholesaleInvoices(params),
    staleTime: 1000 * 15,
  });
}

export function useRegenerateWholesaleInvoicePdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => regenerateWholesaleInvoicePdf(invoiceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wholesaleInvoices"] }),
  });
}

export function useWholesaleReport(params: { from: string; to: string }, enabled = true) {
  return useQuery({
    queryKey: ["wholesaleReport", params],
    queryFn: () => getWholesaleReport(params),
    enabled: enabled && Boolean(params.from && params.to),
    staleTime: 1000 * 30,
  });
}

// ─── Influencers ─────────────────────────────────────────────────────────────

export function useAdminInfluencerAnalytics(params?: {
  topLimit?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["adminInfluencers", "analytics", params],
    queryFn: () => getAdminInfluencerAnalytics(params),
    staleTime: 1000 * 30,
  });
}

export function useAdminInfluencers(params?: {
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "PAUSED" | "BANNED";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["adminInfluencers", "list", params],
    queryFn: () => listAdminInfluencers(params),
    staleTime: 1000 * 30,
  });
}

export function useCreateAdminInfluencer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      referralCode: string;
      commissionRate: number;
    }) => createAdminInfluencer(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "list"] });
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "analytics"] });
    },
  });
}

export function useUpdateAdminInfluencerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      influencerId,
      status,
    }: {
      influencerId: string;
      status: "ACTIVE" | "PAUSED" | "BANNED";
    }) => updateAdminInfluencerStatus(influencerId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "list"] });
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "analytics"] });
    },
  });
}

export function useUpdateAdminInfluencerCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      influencerId,
      commissionRate,
    }: {
      influencerId: string;
      commissionRate: number;
    }) => updateAdminInfluencerCommission(influencerId, { commissionRate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "list"] });
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "analytics"] });
    },
  });
}

export function useUpdateAdminInfluencerDashboardAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      influencerId,
      canViewDashboard,
    }: {
      influencerId: string;
      canViewDashboard: boolean;
    }) =>
      updateAdminInfluencerDashboardAccess(influencerId, { canViewDashboard }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "list"] });
    },
  });
}

export function useAdminInfluencerPayouts(
  influencerId: string | null,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["adminInfluencers", "payouts", influencerId, params],
    queryFn: () => listAdminInfluencerPayouts(influencerId!, params),
    enabled: Boolean(influencerId),
    staleTime: 1000 * 30,
  });
}

export function useRecordAdminInfluencerPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      influencerId,
      amount,
      referenceNote,
    }: {
      influencerId: string;
      amount: number;
      referenceNote?: string;
    }) => recordAdminInfluencerPayout(influencerId, { amount, referenceNote }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["adminInfluencers", "payouts", variables.influencerId],
      });
      qc.invalidateQueries({ queryKey: ["adminInfluencers", "list"] });
    },
  });
}

export function useUpdateAdminInfluencerPayoutStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      influencerId,
      payoutId,
      status,
      referenceNote,
    }: {
      influencerId: string;
      payoutId: string;
      status: "COMPLETED" | "FAILED";
      referenceNote?: string;
    }) =>
      updateAdminInfluencerPayoutStatus(payoutId, { status, referenceNote }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["adminInfluencers", "payouts", variables.influencerId],
      });
    },
  });
}

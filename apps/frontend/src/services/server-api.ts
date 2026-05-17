import type {
  Category,
  Product,
  ProductListParams,
  ProductListResponse,
} from "@/services/api";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export const CATALOG_REVALIDATE_SECONDS = 60;
const isBuildPhase = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

export class ServerApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
  }
}

const getApiBase = () => {
  const base = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!base) {
    throw new ServerApiError(
      "BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required for server rendering.",
    );
  }

  return `${base.replace(/\/$/, "")}/api/v1`;
};

const toQueryString = (params: object) => {
  const q = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.set(key, String(value));
    }
  });

  const query = q.toString();
  return query ? `?${query}` : "";
};

async function serverApiFetch<T>(
  path: string,
  options?: RequestInit & {
    next?: {
      revalidate?: number;
      tags?: string[];
    };
  },
): Promise<T> {
  let res: Response;
  const headers = new Headers(options?.headers);
  headers.set("Accept", "application/json");

  try {
    res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
      next: {
        revalidate: CATALOG_REVALIDATE_SECONDS,
        ...options?.next,
      },
    });
  } catch (error) {
    throw new ServerApiError(
      error instanceof Error ? error.message : "Unable to reach backend.",
    );
  }

  if (!res.ok) {
    throw new ServerApiError(`Backend responded with ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
}

export const listCategories = (
  revalidate = CATALOG_REVALIDATE_SECONDS,
) => {
  if (isBuildPhase) return Promise.resolve([]);

  return serverApiFetch<Category[]>("/products/categories", {
    next: {
      revalidate,
      tags: ["categories"],
    },
  });
};

export const listProducts = (
  params: ProductListParams = {},
  revalidate = CATALOG_REVALIDATE_SECONDS,
) => {
  if (isBuildPhase) {
    return Promise.resolve({
      data: [],
      total: 0,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      totalPages: 0,
    });
  }

  return serverApiFetch<ProductListResponse>(
    `/products${toQueryString(params)}`,
    {
      next: {
        revalidate,
        tags: ["products"],
      },
    },
  );
};

export const getProductBySlug = (
  slug: string,
  revalidate = CATALOG_REVALIDATE_SECONDS,
) => {
  if (isBuildPhase) {
    return Promise.reject(
      new ServerApiError("Backend unavailable during build.", 503),
    );
  }

  return serverApiFetch<Product>(`/products/slug/${encodeURIComponent(slug)}`, {
    next: {
      revalidate,
      tags: [`product:${slug}`],
    },
  });
};

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import {
  ServerApiError,
  getProductBySlug,
  listProducts,
} from "@/services/server-api";

export const revalidate = 60;
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const isMissingResource = (error: unknown) =>
  error instanceof ServerApiError && error.status === 404;

const DEFAULT_DESCRIPTION = "Natural skincare products";
const DEFAULT_OG_IMAGE = "/img/pureastra.webp";
const OG_TARGET_RATIO = 1200 / 630;
const OG_RATIO_TOLERANCE = 0.28;
const SOCIAL_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const getSiteOrigin = () => {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_URL;

  if (!siteUrl) {
    return "http://localhost:3000";
  }

  try {
    return new URL(siteUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
};

const asAbsoluteUrl = (input: string | null | undefined, origin: string) => {
  if (!input) return null;

  try {
    const url = new URL(input, origin);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const hasSupportedSocialImageExtension = (url: string) => {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return [...SOCIAL_IMAGE_EXTENSIONS].some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
};

const isLikelyOgRatio = (width?: number | null, height?: number | null) => {
  if (!width || !height || width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(ratio - OG_TARGET_RATIO) <= OG_RATIO_TOLERANCE;
};

const normalizeDescription = (value: string | null | undefined) => {
  if (!value) return DEFAULT_DESCRIPTION;

  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return DEFAULT_DESCRIPTION;
  return cleaned.slice(0, 180);
};

const buildShareTitle = (name: string | null | undefined) => {
  const productName = (name ?? "").trim();
  if (!productName) return "Shop Pureastra Skincare";

  const title = `${productName} | Pureastra Skincare`;
  return title.length <= 65 ? title : `${title.slice(0, 62)}...`;
};

const buildShareDescription = (
  productDescription: string | null | undefined,
  productName: string | null | undefined,
) => {
  const cleaned = normalizeDescription(productDescription);
  const name = (productName ?? "").trim();

  if (!name) return cleaned;

  const enriched = `${cleaned} Shop ${name} on Pureastra.`;
  return enriched.length <= 180 ? enriched : `${enriched.slice(0, 177)}...`;
};

const addImageVersion = (absoluteUrl: string, version: string | undefined) => {
  if (!version) return absoluteUrl;
  try {
    const url = new URL(absoluteUrl);
    url.searchParams.set("v", version);
    return url.toString();
  } catch {
    return absoluteUrl;
  }
};

export async function generateStaticParams() {
  const products = await listProducts({
    limit: 100,
    isActive: true,
  }).catch(() => undefined);

  return (products?.data ?? [])
    .filter((product) => Boolean(product.slug))
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: ProductPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const origin = getSiteOrigin();
  const pageUrl = `${origin}/product/${encodeURIComponent(slug)}`;

  try {
    const product = await getProductBySlug(slug);
    const images = product.images ?? [];

    const bestRatioImage = images.find(
      (image) =>
        Boolean(image.heroImageUrl) &&
        isLikelyOgRatio(image.width, image.height),
    );

    const firstHeroImage = images.find((image) => Boolean(image.heroImageUrl));
    const firstImage = images.find((image) => Boolean(image.imageUrl));
    const selectedImage = bestRatioImage ?? firstHeroImage ?? firstImage;

    const selectedImageUrl =
      selectedImage?.heroImageUrl ?? selectedImage?.imageUrl ?? DEFAULT_OG_IMAGE;

    const selectedImageAbsolute = asAbsoluteUrl(selectedImageUrl, origin);
    const selectedImageSupported =
      selectedImageAbsolute && hasSupportedSocialImageExtension(selectedImageAbsolute);

    const shouldUseSelectedImage =
      Boolean(selectedImageSupported) &&
      (bestRatioImage !== undefined ||
        !selectedImage?.width ||
        !selectedImage?.height ||
        isLikelyOgRatio(selectedImage.width, selectedImage.height));

    const fallbackImage = asAbsoluteUrl(DEFAULT_OG_IMAGE, origin)!;
    const versionSeed = selectedImage?.id ?? product.id;
    const ogImage = addImageVersion(
      shouldUseSelectedImage ? selectedImageAbsolute! : fallbackImage,
      versionSeed,
    );

    const title = buildShareTitle(product.name);
    const description = buildShareDescription(product.description, product.name);

    return {
      title,
      description,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title,
        description,
        type: "product",
        url: pageUrl,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    const fallbackImage = asAbsoluteUrl(DEFAULT_OG_IMAGE, origin)!;

    return {
      title: "Shop Pureastra Skincare",
      description: DEFAULT_DESCRIPTION,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: "Shop Pureastra Skincare",
        description: DEFAULT_DESCRIPTION,
        type: "product",
        url: pageUrl,
        images: [
          {
            url: fallbackImage,
            width: 1200,
            height: 630,
            alt: "Pureastra product",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Shop Pureastra Skincare",
        description: DEFAULT_DESCRIPTION,
        images: [fallbackImage],
      },
    };
  }
}

export default async function Page(props: ProductPageProps) {
  const { slug } = await props.params;

  try {
    const product = await getProductBySlug(slug);
    const categoryId = product.categories?.[0]?.category?.id;
    const relatedProducts = categoryId
      ? await listProducts({
          categoryId,
          isActive: true,
          limit: 4,
        }).catch(() => undefined)
      : undefined;

    return (
      <ProductClient
        product={product}
        initialRelatedProducts={relatedProducts}
      />
    );
  } catch (error) {
    if (isMissingResource(error)) {
      notFound();
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center text-[#5E2B16]">
        <h1 className="text-2xl font-semibold">Product unavailable</h1>
        <p className="max-w-md text-sm text-[#7B6A58]">
          We could not load this product right now. Please try again in a
          moment.
        </p>
      </div>
    );
  }
}

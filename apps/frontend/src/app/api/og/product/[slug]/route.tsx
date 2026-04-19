import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/services/server-api";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

const DEFAULT_IMAGE = "/img/pureastra.webp";

type RouteContext = {
  params: Promise<{ slug: string }>;
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

const encodeBase64 = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64");

const toDataUrl = async (absoluteUrl: string) => {
  try {
    const res = await fetch(absoluteUrl, { cache: "no-store" });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.length) return null;

    return `data:${contentType};base64,${encodeBase64(bytes)}`;
  } catch {
    return null;
  }
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const origin = new URL(request.url).origin;

  let title = "Pureastra Skincare";
  let imageUrl = asAbsoluteUrl(DEFAULT_IMAGE, origin);

  try {
    const product = await getProductBySlug(slug);
    title = product.name?.trim() || title;

    const images = product.images ?? [];
    const mainImage = images.find((image) => image.position === 0) ?? images[0];
    const firstHeroImage = images.find((image) => Boolean(image.heroImageUrl));
    const firstImage = images.find((image) => Boolean(image.imageUrl));
    const selectedImage = mainImage ?? firstHeroImage ?? firstImage;

    imageUrl =
      asAbsoluteUrl(
        selectedImage?.heroImageUrl ?? selectedImage?.imageUrl,
        origin,
      ) ?? imageUrl;
  } catch {
    // Render a branded fallback card when product lookup fails.
  }

  const imageDataUrl = imageUrl ? await toDataUrl(imageUrl) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "linear-gradient(135deg, #f6f1e7 0%, #e8dcc7 100%)",
          color: "#4a2a1a",
          fontFamily: "Arial",
          alignItems: "stretch",
          justifyContent: "space-between",
          padding: "40px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "560px",
            height: "550px",
            borderRadius: "24px",
            background: "#fdf9f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border: "1px solid rgba(94,43,22,0.15)",
          }}
        >
          {imageDataUrl ? (
            <img
              src={imageDataUrl}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                color: "#6b4b3a",
                fontSize: 30,
                fontWeight: 600,
              }}
            >
              Pureastra
            </div>
          )}
        </div>

        <div
          style={{
            width: "540px",
            height: "550px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: "#819744",
              letterSpacing: "1px",
              fontWeight: 700,
            }}
          >
            PUREASTRA
          </div>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 700,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#5e2b16",
              opacity: 0.8,
            }}
          >
            Natural skincare made for daily glow
          </div>
        </div>
      </div>
    ),
    size,
  );
}

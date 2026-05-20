import {
  faBalanceScale,
  faDroplet,
  faLeaf,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ProductContentSection } from "@/services/api";

export function getSection(
  sections: ProductContentSection[],
  type: string,
): ProductContentSection | undefined {
  return sections.find((s) => s.sectionType === type);
}

const metricIconMap: Record<string, IconDefinition> = {
  brightening: faSun,
  hydration: faDroplet,
  sebum: faBalanceScale,
  balance: faBalanceScale,
};

export function getMetricIcon(metricName: string, metricIcon?: string | null) {
  const key = (metricIcon ?? metricName).toLowerCase();
  for (const [matcher, icon] of Object.entries(metricIconMap)) {
    if (key.includes(matcher)) {
      return icon;
    }
  }
  return faLeaf;
}

export function getRelativeDateLabel(dateISO: string) {
  const createdAt = new Date(dateISO).getTime();
  if (Number.isNaN(createdAt)) return "Just now";
  const diffMs = Date.now() - createdAt;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(1, Math.floor(diffMs / dayMs));
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export type ProductGalleryImage = {
  imageUrl: string;
  heroImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  placeholder?: string | null;
  width?: number | null;
  height?: number | null;
};

export type DiscountTimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getDiscountTimeLeft(discountEndsAt?: string | null): DiscountTimeLeft | null {
  if (!discountEndsAt) return null;

  const endAt = new Date(discountEndsAt).getTime();
  if (Number.isNaN(endAt)) return null;

  const diff = endAt - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

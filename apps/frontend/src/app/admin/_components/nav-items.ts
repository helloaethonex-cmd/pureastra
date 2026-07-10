import {
  faBoxOpen,
  faChartLine,
  faChartPie,
  faComment,
  faGaugeHigh,
  faLayerGroup,
  faStore,
  faTruck,
  faUsers,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: IconDefinition;
}

export interface AdminNavPlaceholder {
  label: string;
  icon: IconDefinition;
}

/** §3.2 route map — every existing admin route, unchanged, plus the new Dashboard landing. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: faGaugeHigh },
  { label: "Products", href: "/admin/products", icon: faBoxOpen },
  { label: "Categories", href: "/admin/categories", icon: faLayerGroup },
  { label: "Orders", href: "/admin/orders", icon: faTruck },
  { label: "Reports", href: "/admin/reports", icon: faChartLine },
  { label: "Influencers", href: "/admin/influencers", icon: faUsers },
  { label: "Vendors", href: "/admin/vendors", icon: faStore },
];

/** Disabled nav placeholders — backends don't exist yet (§1.2, §3.2). */
export const ADMIN_NAV_PLACEHOLDERS: AdminNavPlaceholder[] = [
  { label: "Feedback", icon: faComment },
  { label: "Inventory", icon: faWarehouse },
  { label: "Analytics", icon: faChartPie },
];

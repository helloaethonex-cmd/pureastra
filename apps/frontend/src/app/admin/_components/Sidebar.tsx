"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ADMIN_NAV_ITEMS, ADMIN_NAV_PLACEHOLDERS } from "./nav-items";
import { easeInOutPremium } from "./motion";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavList({
  pathname,
  showLabels,
  withLayoutId,
  onNavigate,
}: {
  pathname: string;
  showLabels: boolean;
  withLayoutId: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-[var(--admin-r-md)] px-3 py-2 text-[length:var(--admin-text-sm)] font-medium transition-colors duration-[var(--admin-duration-occasional)] ${
              active
                ? "text-[var(--admin-primary)]"
                : "text-[var(--admin-ink-secondary)] hover:bg-black/5"
            }`}
          >
            {active &&
              (withLayoutId ? (
                <motion.span
                  layoutId="admin-nav-active-pill"
                  className="absolute inset-0 rounded-[var(--admin-r-md)] bg-[var(--admin-card-bg)] shadow-[var(--admin-elev-1)]"
                  transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                />
              ) : (
                <span className="absolute inset-0 rounded-[var(--admin-r-md)] bg-[var(--admin-card-bg)] shadow-[var(--admin-elev-1)]" />
              ))}
            <FontAwesomeIcon icon={item.icon} className="relative z-10 w-4 shrink-0" />
            {showLabels && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
          </Link>
        );
      })}
      <div className="my-2 border-t border-[var(--admin-border)]" />
      {ADMIN_NAV_PLACEHOLDERS.map((item) => (
        <div
          key={item.label}
          title="Backend pending"
          className="flex cursor-not-allowed items-center gap-3 rounded-[var(--admin-r-md)] px-3 py-2 text-[length:var(--admin-text-sm)] text-[var(--admin-disabled-fg)]"
        >
          <FontAwesomeIcon icon={item.icon} className="w-4 shrink-0" />
          {showLabels && (
            <span className="flex items-center gap-2 whitespace-nowrap">
              {item.label}
              <span className="rounded-full bg-[var(--admin-disabled-bg)] px-1.5 py-0.5 text-[length:var(--admin-text-2xs)]">
                Coming soon
              </span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

/** §3.1 SideNav — current-route indicator is a state-driven layout animation, not keyframes. */
export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <>
      <aside
        className={`hidden md:sticky md:top-0 md:flex md:h-screen md:flex-col border-r border-[var(--admin-border)] bg-[var(--admin-panel-bg)] ${
          collapsed ? "md:w-16" : "md:w-60"
        }`}
      >
        <NavList pathname={pathname} showLabels={!collapsed} withLayoutId onNavigate={() => {}} />
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center gap-2 border-t border-[var(--admin-border)] p-3 text-[var(--admin-ink-muted)] transition-colors duration-[var(--admin-duration-occasional)] hover:text-[var(--admin-primary)]"
        >
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-60 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-panel-bg)]"
              initial={{ x: reduceMotion ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduceMotion ? 0 : "-100%" }}
              transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: easeInOutPremium }}
            >
              <NavList pathname={pathname} showLabels withLayoutId={false} onNavigate={onMobileClose} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

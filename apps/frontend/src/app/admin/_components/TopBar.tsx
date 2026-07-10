"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { faBars, faChevronRight, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuthStore } from "@/store/auth.store";
import { useSignOut } from "@/hooks/useAuth";
import { ADMIN_NAV_ITEMS } from "./nav-items";

interface TopBarProps {
  onOpenMobileNav: () => void;
}

function useBreadcrumbLabel(pathname: string) {
  if (pathname === "/admin") return "Dashboard";
  const match = ADMIN_NAV_ITEMS.find((item) => item.href !== "/admin" && pathname.startsWith(item.href));
  return match?.label ?? "Admin";
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const pathname = usePathname();
  const label = useBreadcrumbLabel(pathname);
  const { user } = useAuthStore();
  const signOut = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-content-bg)] px-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--admin-r-sm)] text-[var(--admin-ink-secondary)] hover:bg-black/5 md:hidden"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <span className="hidden shrink-0 text-[length:var(--admin-text-sm)] font-semibold text-[var(--admin-primary)] sm:inline">
          Pureastra Admin
        </span>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
          <span className="hidden sm:inline">/</span>
          <span>Admin</span>
          {label !== "Dashboard" && (
            <>
              <FontAwesomeIcon icon={faChevronRight} className="text-[8px]" />
              <span className="truncate text-[var(--admin-ink)]">{label}</span>
            </>
          )}
        </nav>
      </div>

      {user && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-[var(--admin-r-md)] px-2 py-1.5 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-secondary)] hover:bg-black/5"
          >
            <span className="hidden max-w-[14ch] truncate sm:inline">{user.email}</span>
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-full mt-1 w-56 rounded-[var(--admin-r-md)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-1 shadow-[var(--admin-elev-2)]"
            >
              <p className="truncate px-3 py-2 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)] sm:hidden">
                {user.email}
              </p>
              <button
                onClick={() => signOut.mutate()}
                className="flex w-full items-center gap-2 rounded-[var(--admin-r-sm)] px-3 py-2 text-left text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)] hover:bg-[var(--admin-error-bg)]"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

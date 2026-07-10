"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import "./admin-tokens.css";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { pageEnterVariants } from "./motion";

export function AdminShellClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="admin-root flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
        <motion.main
          key={pathname}
          initial="hidden"
          animate="visible"
          variants={pageEnterVariants(reduceMotion)}
          className="flex-1 px-4 py-6 sm:px-6 md:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

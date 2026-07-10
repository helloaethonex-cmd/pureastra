"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { backdropVariants, modalVariants } from "./motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/** Sparingly used — centered dialog, focus-trap, Esc-close. Exhaust inline alternatives first. */
export function Modal({ open, onClose, title, children, className = "" }: ModalProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="admin-root fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            variants={backdropVariants(reduceMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={modalVariants(reduceMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full max-w-lg rounded-[var(--admin-r-lg)] bg-[var(--admin-card-bg)] p-6 shadow-[var(--admin-elev-2)] ${className}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--admin-r-sm)] text-[var(--admin-ink-muted)] hover:bg-[var(--admin-surface-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)]"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

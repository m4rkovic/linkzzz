"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDialogFocus<T extends HTMLElement>({
  open,
  onClose,
  closeOnEscape = true,
  initialFocusRef,
}: {
  open: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      const target = initialFocusRef?.current
        ?? containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      target?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
      if (!focusables.length) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [closeOnEscape, initialFocusRef, onClose, open]);

  return containerRef;
}

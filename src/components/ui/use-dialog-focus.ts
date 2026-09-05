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

let activeBodyLocks = 0;
let bodyOverflowBeforeDialogs = "";

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
    if (activeBodyLocks === 0) {
      bodyOverflowBeforeDialogs = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    activeBodyLocks += 1;

    const getFocusables = () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.tabIndex !== -1,
      );

    const timer = window.setTimeout(() => {
      const focusables = getFocusables();
      const target = initialFocusRef?.current ?? focusables[0] ?? containerRef.current;
      target?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Only the dialog currently containing focus may consume Escape. This
      // prevents nested dialogs from closing multiple layers at once.
      if (event.key === "Escape") {
        if (
          closeOnEscape &&
          onClose &&
          container.contains(document.activeElement)
        ) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = getFocusables();
      if (!focusables.length) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const activeElement = document.activeElement;

      if (!container.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      activeBodyLocks = Math.max(0, activeBodyLocks - 1);
      if (activeBodyLocks === 0) {
        document.body.style.overflow = bodyOverflowBeforeDialogs;
      }
      if (previous?.isConnected) previous.focus?.();
    };
  }, [closeOnEscape, initialFocusRef, onClose, open]);

  return containerRef;
}

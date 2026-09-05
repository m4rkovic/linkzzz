"use client";

import type { MouseEvent, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

import { useDialogFocus } from "@/components/ui/use-dialog-focus";
import { useHydrated } from "@/components/ui/use-hydrated";

type DialogShellProps = {
  open: boolean;
  children: ReactNode;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  role?: "dialog" | "alertdialog";
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  overlayClassName?: string;
  panelClassName?: string;
};

/**
 * Shared modal boundary for Linkzzz. It owns the portal, backdrop dismissal,
 * focus trap/restore, Escape handling, body scroll locking and ARIA wiring.
 * Individual dialogs only own their content and visual layout.
 */
export function DialogShell({
  open,
  children,
  onClose,
  closeOnEscape = true,
  closeOnBackdrop = true,
  initialFocusRef,
  role = "dialog",
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby,
  overlayClassName = "z-[90]",
  panelClassName = "",
}: DialogShellProps) {
  const hydrated = useHydrated();
  const active = open && hydrated;
  const dialogRef = useDialogFocus<HTMLDivElement>({
    open: active,
    onClose,
    closeOnEscape: closeOnEscape && Boolean(onClose),
    initialFocusRef,
  });

  if (!active) return null;

  function handleBackdropPointer(event: MouseEvent<HTMLDivElement>) {
    if (
      event.target === event.currentTarget &&
      closeOnBackdrop &&
      onClose
    ) {
      onClose();
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-5 ${overlayClassName}`}
      role="presentation"
      onMouseDown={handleBackdropPointer}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        tabIndex={-1}
        className={`relative w-full outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

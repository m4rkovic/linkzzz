"use client";

import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      destructive={danger}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
}

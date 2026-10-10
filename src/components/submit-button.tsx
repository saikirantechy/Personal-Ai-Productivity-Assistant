"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
} as const;

type Variant = keyof typeof buttonStyles;

export function SubmitButton({
  children,
  pendingLabel,
  variant = "secondary",
  className,
  title,
  ariaLabel,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: Variant;
  className?: string;
  title?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      aria-label={ariaLabel}
      className={cn(buttonStyles[variant], className)}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function ConfirmSubmitButton({
  children,
  pendingLabel,
  confirmMessage,
  variant = "ghost",
  className,
  title,
  ariaLabel,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  confirmMessage: string;
  variant?: Variant;
  className?: string;
  title?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      aria-label={ariaLabel}
      className={cn(buttonStyles[variant], className)}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

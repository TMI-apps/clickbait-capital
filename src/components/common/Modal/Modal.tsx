import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  /** Accessible description; rendered visually below the title. */
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  /**
   * When false the dialog must be answered through its own content: no close button, and
   * Escape or an overlay click do nothing. Default true.
   */
  dismissible?: boolean;
  /** Accessible name of the close button. Default "Close"; Dutch screens pass "Sluiten". */
  closeLabel?: string;
  /**
   * Runs when focus would return after closing; call `event.preventDefault()` to place it
   * yourself (e.g. when the element that opened the dialog is gone).
   */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * Centered dialog (shadcn/ui Dialog on Radix). Closes on overlay click, Escape, or the X button,
 * unless `dismissible` is false.
 */
export const Modal = ({
  open,
  onClose,
  title,
  description,
  actions,
  children,
  className,
  dismissible = true,
  closeLabel = "Close",
  onCloseAutoFocus,
}: ModalProps) => {
  const blockDismiss = (event: Event): void => {
    if (!dismissible) event.preventDefault();
  };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          {...(!description && { "aria-describedby": undefined })}
          onCloseAutoFocus={onCloseAutoFocus}
          onEscapeKeyDown={blockDismiss}
          onPointerDownOutside={blockDismiss}
          onInteractOutside={blockDismiss}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] overflow-y-auto overscroll-contain -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-popover p-6 text-popover-foreground elevation-lg duration-(--duration-normal) data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
            className
          )}
        >
          {title && (
            <DialogPrimitive.Title
              className={cn("text-lg leading-tight font-semibold", dismissible && "pr-8")}
            >
              {title}
            </DialogPrimitive.Title>
          )}
          {description && (
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
          <div>{children}</div>
          {actions && <div className="flex justify-end gap-2">{actions}</div>}
          {dismissible && (
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-sm opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

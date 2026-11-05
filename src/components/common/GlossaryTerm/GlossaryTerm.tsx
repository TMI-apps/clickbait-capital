import { useId, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { cn } from "@/shared/utils/cn";

export interface GlossaryTermProps {
  /** The word as it appears in the sentence. */
  children: ReactNode;
  /** Short explanation shown on tap and read to screen readers. */
  meaning: string;
  className?: string;
}

/**
 * A hard word inside running text (toggletip): emphasized, a real button, tap / click / Enter
 * opens its meaning, Escape or a tap elsewhere closes it. Focus stays on the word so reading
 * goes on; screen readers get the meaning as the button's description. Never place it inside
 * another button or link.
 */
export const GlossaryTerm = ({ children, meaning, className }: GlossaryTermProps) => {
  const meaningId = useId();
  const termId = useId();
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={termId}
          type="button"
          data-slot="glossary-term"
          aria-describedby={meaningId}
          className={cn(
            "inline cursor-help rounded-sm bg-transparent p-0 font-semibold text-primary underline decoration-dotted decoration-2 underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring data-[state=open]:bg-primary/10",
            className
          )}
        >
          {children}
        </button>
      </PopoverPrimitive.Trigger>
      <span id={meaningId} hidden>
        {meaning}
      </span>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          sideOffset={6}
          collisionPadding={16}
          aria-labelledby={termId}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-50 max-w-64 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground elevation-md animate-in fade-in-0 zoom-in-95"
        >
          <span className="font-semibold">{children}</span>: {meaning}
          <PopoverPrimitive.Arrow className="fill-popover" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

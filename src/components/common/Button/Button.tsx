import type { ComponentProps } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

/**
 * Button variants (shadcn/ui). Brand look lives here and in `src/index.css`:
 * - default: brand gradient (theme primary) for main actions
 * - outline: foreground outline for secondary actions
 * - choice: one option in a list of answers (e.g. event options); a quiet card surface that
 *   holds multi-line, coloured content, left-aligned at full width
 * outline and choice share `interactive-tint` (src/index.css): hover/press/focus tint the
 * background and light the border but never change text or icon colours (readable-hover D1).
 * - ghost: primary-colored text button
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-medium transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand-gradient text-primary-foreground",
        outline: "border border-foreground bg-transparent text-foreground interactive-tint",
        choice:
          "w-full flex-col items-start gap-1 border border-input bg-card text-left whitespace-normal text-card-foreground interactive-tint",
        secondary: "bg-secondary text-secondary-foreground elevation-md hover:bg-secondary/90",
        ghost: "text-primary hover:bg-primary/10",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4",
        lg: "h-14 px-8 text-base",
        icon: "size-9",
      },
    },
    compoundVariants: [
      // After the size classes, so a choice grows with its content instead of the fixed height.
      { variant: "choice", class: "h-auto min-h-11 px-4 py-2" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a router `Link`) with button styling. */
    asChild?: boolean;
  };

export const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};

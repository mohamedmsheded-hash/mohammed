import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-element font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-white shadow-btn hover:bg-brand-dark shadow-accent",
        secondary:
          "bg-white border border-border text-foreground shadow-btn hover:bg-[#fafbfd] hover:border-[#d4dce6]",
        outline:
          "border border-border bg-transparent hover:bg-white text-foreground",
        soft:
          "bg-brand-soft border border-[#ffe2ce] text-brand-dark hover:bg-[#ffe7d5]",
        dark:
          "bg-nav text-white hover:bg-[#121c2b]",
        destructive:
          "bg-white border border-[#f5dada] text-status-red hover:bg-[#fff5f5]",
        ghost: "hover:bg-black/5 text-foreground",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 py-2 text-xs",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

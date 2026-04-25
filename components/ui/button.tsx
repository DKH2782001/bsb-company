import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[linear-gradient(135deg,var(--brand-600),#415bff)] text-white shadow-[0_12px_24px_rgba(88,72,246,0.22)] hover:brightness-[1.03]",
        secondary: "bg-[var(--surface-alt)] text-[var(--text-strong)] hover:bg-[#ebeeff]",
        outline: "border border-[var(--line-soft)] bg-white text-[var(--text-strong)] hover:bg-[var(--surface-alt)]",
        ghost: "text-[var(--text-soft)] hover:bg-[var(--surface-alt)]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "text-[var(--brand-600)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4.5 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

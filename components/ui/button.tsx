import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-brand-navy text-white hover:bg-brand-navy/90",
  outline:
    "border border-brand-navy/20 bg-white text-brand-navy hover:bg-brand-navy/5",
  ghost: "bg-transparent text-brand-navy hover:bg-brand-navy/10"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-neutral disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          className
        )}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? "Loading…" : children}
      </button>
    );
  }
);

Button.displayName = "Button";

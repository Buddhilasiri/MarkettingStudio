import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "danger"
    | "muted"
    | "teal";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-brand-purple/15 text-brand-purple",
  secondary: "bg-brand-navy/10 text-brand-navy",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
  danger: "bg-rose-100 text-rose-700",
  muted: "bg-slate-100 text-slate-600",
  teal: "bg-teal-100 text-teal-700"
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

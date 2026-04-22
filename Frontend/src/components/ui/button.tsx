import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-premium hover:bg-brand-emphasis disabled:bg-brand/70 disabled:text-white/80",
  secondary:
    "bg-white text-foreground border border-border hover:bg-surface-soft disabled:text-muted-foreground",
  ghost: "bg-transparent text-foreground hover:bg-surface-soft disabled:text-muted-foreground",
  danger:
    "bg-danger text-white shadow-premium hover:bg-[#9d1c14] disabled:bg-danger/70 disabled:text-white/80",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:cursor-not-allowed",
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

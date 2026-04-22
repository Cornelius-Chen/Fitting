import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const styles: Record<ButtonVariant, string> = {
  default: "bg-pine text-white hover:bg-ink",
  outline: "border border-pine/25 bg-white text-ink hover:border-pine hover:bg-peach/30",
  ghost: "bg-transparent text-ink hover:bg-white/60",
  secondary: "bg-amber text-ink hover:bg-amber/90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-pine/30 disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
});

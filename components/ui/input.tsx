import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-2xl border border-pine/15 bg-white px-4 py-2 text-sm text-ink outline-none ring-0 transition focus:border-pine/50",
        className,
      )}
      {...props}
    />
  );
});

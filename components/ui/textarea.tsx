import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-pine/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-pine/50",
        className,
      )}
      {...props}
    />
  );
});

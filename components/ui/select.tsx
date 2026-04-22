import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "min-h-11 w-full rounded-2xl border border-pine/15 bg-white px-4 py-2 text-sm text-ink outline-none transition focus:border-pine/50",
        props.className,
      )}
    />
  );
}

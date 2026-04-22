import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-moss/15 px-3 py-1 text-xs font-medium text-pine",
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("h-3 overflow-hidden rounded-full bg-moss/15", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-amber via-moss to-pine transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

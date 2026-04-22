"use client";

import { CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChecklistItem } from "@/types/plan";

export function ChecklistBlock({
  items,
  checks,
  onToggle,
  progress,
}: {
  items: ChecklistItem[];
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
  progress: number;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-ink">
          <span>完成度</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
      {items.map((item) => {
        const checked = checks[item.id];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              "flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition",
              checked ? "border-pine bg-white" : "border-ink/10 bg-white/75",
            )}
          >
            <div>
              <div className="font-medium text-ink">{item.label}</div>
              <div className="mt-1 text-sm leading-6 text-ink/65">{item.description}</div>
            </div>
            <div className={cn("mt-0.5 shrink-0", checked ? "text-pine" : "text-ink/25")}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

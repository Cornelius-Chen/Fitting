"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ChecklistBlock } from "@/components/operating-system/checklist-block";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { Textarea } from "@/components/ui/textarea";
import { systemBlueprints } from "@/data/plan-content";
import { clamp } from "@/lib/utils";
import { usePlanStore } from "@/store/use-plan-store";

export default function SocialPage() {
  const blueprint = systemBlueprints.social;
  const checks = usePlanStore((state) => state.planState.system_checks.social);
  const dailyFocus = usePlanStore((state) => state.planState.daily_focus);
  const toggleSystemCheck = usePlanStore((state) => state.toggleSystemCheck);
  const setDailyFocusField = usePlanStore((state) => state.setDailyFocusField);
  const progress = clamp((Object.values(checks).filter(Boolean).length / blueprint.items.length) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro eyebrow="Social" title="社交系统" description={blueprint.summary} />
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <FieldCard title={blueprint.headline}>
            <ChecklistBlock items={blueprint.items} checks={checks} onToggle={(id) => toggleSystemCheck("social", id)} progress={progress} />
          </FieldCard>
          <FieldCard title="今天的社交训练">
            <div>
              <label className="mb-2 block text-xs text-ink/55">今日社交小任务</label>
              <Textarea value={dailyFocus.social_task} onChange={(event) => setDailyFocusField("social_task", event.target.value)} />
            </div>
            {blueprint.reviewPrompts.map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-sm leading-6 text-ink/70">
                {prompt}
              </div>
            ))}
          </FieldCard>
        </div>
      </div>
    </AppShell>
  );
}

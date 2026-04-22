"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ChecklistBlock } from "@/components/operating-system/checklist-block";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { systemBlueprints } from "@/data/plan-content";
import { clamp } from "@/lib/utils";
import { usePlanStore } from "@/store/use-plan-store";

export default function AppearancePage() {
  const blueprint = systemBlueprints.appearance;
  const checks = usePlanStore((state) => state.planState.system_checks.appearance);
  const toggleSystemCheck = usePlanStore((state) => state.toggleSystemCheck);
  const progress = clamp((Object.values(checks).filter(Boolean).length / blueprint.items.length) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro eyebrow="Appearance" title="外表系统" description={blueprint.summary} />
        <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <FieldCard title={blueprint.headline} description="先把稳定可复现的部分打满，再谈微调。">
            <ChecklistBlock items={blueprint.items} checks={checks} onToggle={(id) => toggleSystemCheck("appearance", id)} progress={progress} />
          </FieldCard>
          <FieldCard title="复盘问题">
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

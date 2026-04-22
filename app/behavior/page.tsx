"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ChecklistBlock } from "@/components/operating-system/checklist-block";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { systemBlueprints } from "@/data/plan-content";
import { clamp } from "@/lib/utils";
import { usePlanStore } from "@/store/use-plan-store";

export default function BehaviorPage() {
  const blueprint = systemBlueprints.behavior;
  const checks = usePlanStore((state) => state.planState.system_checks.behavior);
  const dailyFocus = usePlanStore((state) => state.planState.daily_focus);
  const toggleSystemCheck = usePlanStore((state) => state.toggleSystemCheck);
  const setDailyFocusField = usePlanStore((state) => state.setDailyFocusField);
  const profile = usePlanStore((state) => state.profile);
  const updateProfileField = usePlanStore((state) => state.updateProfileField);
  const persistProfile = usePlanStore((state) => state.persistProfile);
  const progress = clamp((Object.values(checks).filter(Boolean).length / blueprint.items.length) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro eyebrow="Behavior" title="行为系统" description={blueprint.summary} />
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <FieldCard title={blueprint.headline}>
            <ChecklistBlock items={blueprint.items} checks={checks} onToggle={(id) => toggleSystemCheck("behavior", id)} progress={progress} />
          </FieldCard>
          <FieldCard title="行为参数" description="把最基础的控制层参数先定死。">
            <div>
              <label className="mb-2 block text-xs text-ink/55">目标睡眠时长</label>
              <Input
                type="number"
                step="0.5"
                value={profile.sleep_target}
                onChange={(event) => updateProfileField("sleep_target", Number(event.target.value))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">默认深度任务块（分钟）</label>
              <Input
                type="number"
                value={profile.focus_block_minutes}
                onChange={(event) => updateProfileField("focus_block_minutes", Number(event.target.value))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">今日行为重点</label>
              <Textarea value={dailyFocus.behavior_focus} onChange={(event) => setDailyFocusField("behavior_focus", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">低配保底</label>
              <Textarea value={dailyFocus.low_power_floor} onChange={(event) => setDailyFocusField("low_power_floor", event.target.value)} />
            </div>
            <button type="button" className="rounded-2xl bg-pine px-4 py-3 text-sm font-medium text-white" onClick={() => void persistProfile()}>
              保存行为参数
            </button>
          </FieldCard>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ChecklistBlock } from "@/components/operating-system/checklist-block";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { Textarea } from "@/components/ui/textarea";
import { systemBlueprints } from "@/data/plan-content";
import { clamp } from "@/lib/utils";
import { usePlanStore } from "@/store/use-plan-store";

export default function InnerPage() {
  const blueprint = systemBlueprints.inner;
  const checks = usePlanStore((state) => state.planState.system_checks.inner);
  const dailyFocus = usePlanStore((state) => state.planState.daily_focus);
  const weeklyReview = usePlanStore((state) => state.planState.weekly_review);
  const toggleSystemCheck = usePlanStore((state) => state.toggleSystemCheck);
  const setDailyFocusField = usePlanStore((state) => state.setDailyFocusField);
  const setWeeklyReviewField = usePlanStore((state) => state.setWeeklyReviewField);
  const progress = clamp((Object.values(checks).filter(Boolean).length / blueprint.items.length) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro eyebrow="Inner" title="内在系统" description={blueprint.summary} />
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <FieldCard title={blueprint.headline}>
            <ChecklistBlock items={blueprint.items} checks={checks} onToggle={(id) => toggleSystemCheck("inner", id)} progress={progress} />
          </FieldCard>
          <FieldCard title="当日与当周复盘">
            <div>
              <label className="mb-2 block text-xs text-ink/55">今日内在重点</label>
              <Textarea value={dailyFocus.inner_task} onChange={(event) => setDailyFocusField("inner_task", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">本周做对了什么</label>
              <Textarea value={weeklyReview.wins} onChange={(event) => setWeeklyReviewField("wins", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">本周最明显的漂移</label>
              <Textarea value={weeklyReview.drifts} onChange={(event) => setWeeklyReviewField("drifts", event.target.value)} />
            </div>
          </FieldCard>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { phaseMeta, weeklyRoadmap } from "@/data/plan-content";
import { usePlanStore } from "@/store/use-plan-store";

export default function RoadmapPage() {
  const currentWeek = usePlanStore((state) => state.planState.current_week);
  const setCurrentWeek = usePlanStore((state) => state.setCurrentWeek);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Roadmap"
          title="12 周路线图"
          description="路线图的意义不是给你更多待办，而是明确这个阶段真正该压什么、建什么、整合什么。"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {Object.values(phaseMeta).map((phase) => (
            <FieldCard key={phase.title} title={phase.title} description={phase.weeks}>
              <div className="text-sm leading-6 text-ink/70">{phase.focus}</div>
              <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-sm text-ink/70">
                阶段结果：{phase.target}
              </div>
            </FieldCard>
          ))}
        </div>

        <FieldCard title="按周推进" description="只看当前这周的主题、结果和风险，不要重新散回去。">
          <div className="grid gap-3">
            {weeklyRoadmap.map((item) => (
              <button
                key={item.week}
                type="button"
                onClick={() => setCurrentWeek(item.week)}
                className={`rounded-2xl border p-4 text-left transition ${currentWeek === item.week ? "border-pine bg-white" : "border-ink/10 bg-white/75"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium text-ink">第 {item.week} 周 · 第 {item.phase} 阶段</div>
                  {currentWeek === item.week ? <Button className="h-8 rounded-xl px-3 py-1 text-xs">当前周</Button> : null}
                </div>
                <div className="mt-2 text-sm text-ink/75">主题：{item.theme}</div>
                <div className="mt-1 text-sm text-ink/65">结果：{item.outcome}</div>
                <div className="mt-1 text-sm text-ink/55">警惕：{item.caution}</div>
              </button>
            ))}
          </div>
        </FieldCard>
      </div>
    </AppShell>
  );
}

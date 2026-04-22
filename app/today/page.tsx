"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { FieldCard, MetricCard, PageIntro, ScoreCard } from "@/components/operating-system/sections";
import { usePlanSelectors, usePlanStore } from "@/store/use-plan-store";

export default function TodayPage() {
  const metrics = usePlanSelectors();
  const dailyFocus = usePlanStore((state) => state.planState.daily_focus);
  const generateTodayPlan = usePlanStore((state) => state.generateTodayPlan);
  const saveDailyReport = usePlanStore((state) => state.saveDailyReport);
  const saving = usePlanStore((state) => state.saving);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Today"
          title="今日执行"
          description="今天不是拼更多，而是让主项目、定向输入、社交推进和内在控制形成闭环。"
          aside={
            <div className="rounded-[24px] border border-ink/10 bg-canvas/70 p-4 text-sm leading-6 text-ink/70">
              <div className="font-medium text-ink">今日节奏判断</div>
              <div className="mt-2">{metrics.rhythmStatus}</div>
              <div className="mt-3 text-xs text-ink/55">最近一次刷新：{usePlanStore.getState().planState.today_generated_at ?? "尚未生成"}</div>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="今日综合分" value={`${metrics.overallScore}`} detail="今天的控制层强弱" />
          <MetricCard label="提醒完成度" value={`${metrics.reminderCompletion}%`} detail="三段提醒是否真落地" />
          <MetricCard label="行为系统" value={`${metrics.systemScores.behavior}%`} detail="锚点、时间盒和切换是否守住" />
          <MetricCard label="学习系统" value={`${metrics.systemScores.learning}%`} detail="是否真的完成了回写" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <FieldCard title="今日主线">
            <div className="grid gap-3 md:grid-cols-2">
              <ScoreCard title="外表系统" score={metrics.systemScores.appearance} detail={dailyFocus.appearance_focus} />
              <ScoreCard title="行为系统" score={metrics.systemScores.behavior} detail={dailyFocus.behavior_focus} />
              <ScoreCard title="社交系统" score={metrics.systemScores.social} detail={dailyFocus.social_task} />
              <ScoreCard title="内在系统" score={metrics.systemScores.inner} detail={dailyFocus.inner_task} />
            </div>
          </FieldCard>
          <FieldCard title="今日执行卡" description="这是你今天真正该守住的内容。">
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">主项目</div>
              <div className="mt-1 font-medium text-ink">{dailyFocus.main_project}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">今日结果</div>
              <div className="mt-1 font-medium text-ink">{dailyFocus.main_outcome}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">输入焦点</div>
              <div className="mt-1 font-medium text-ink">{dailyFocus.input_focus}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">输出与回写</div>
              <div className="mt-1 font-medium text-ink">{dailyFocus.output_focus}</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">低配保底</div>
              <div className="mt-1 font-medium text-ink">{dailyFocus.low_power_floor}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="rounded-2xl" onClick={generateTodayPlan}>
                重新生成今日执行
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => void saveDailyReport()} disabled={saving}>
                {saving ? "保存中..." : "写入今日日报"}
              </Button>
            </div>
          </FieldCard>
        </div>
      </div>
    </AppShell>
  );
}

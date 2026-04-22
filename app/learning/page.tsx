"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { FieldCard, PageIntro, SectionList } from "@/components/operating-system/sections";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { coreResources, dialogueRoles, learningLoop, learningTracks } from "@/data/plan-content";
import { usePlanStore } from "@/store/use-plan-store";

export default function LearningPage() {
  const learningLog = usePlanStore((state) => state.planState.learning_log);
  const dailyFocus = usePlanStore((state) => state.planState.daily_focus);
  const weeklyReview = usePlanStore((state) => state.planState.weekly_review);
  const setLearningLogField = usePlanStore((state) => state.setLearningLogField);
  const setDailyFocusField = usePlanStore((state) => state.setDailyFocusField);
  const setWeeklyReviewField = usePlanStore((state) => state.setWeeklyReviewField);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Learning OS"
          title="学习与项目升级系统"
          description="你的学习不是按学科摊开，而是围绕真实项目主轴，形成输入、输出、对谈、记录、回写的闭环。"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {learningTracks.map((track) => (
            <FieldCard key={track.id} title={track.title} description={track.goal}>
              {track.bullets.map((bullet) => (
                <div key={bullet} className="rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-sm leading-6 text-ink/70">
                  {bullet}
                </div>
              ))}
            </FieldCard>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SectionList
            title="学习闭环"
            description="任何输入如果不进入这条链，就不算真正学过。"
            items={learningLoop.map((step, index) => ({ title: `步骤 ${index + 1}`, detail: step }))}
          />
          <SectionList
            title="对谈角色"
            description="以后和我讨论，最好明确你希望我扮演哪个角色。"
            items={dialogueRoles.map((role) => ({ title: role.name, detail: role.description }))}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <FieldCard title="当前学习工单" description="让输入和项目绑定，而不是继续漫游。">
            <div>
              <label className="mb-2 block text-xs text-ink/55">当前主项目</label>
              <Input value={learningLog.current_project} onChange={(event) => setLearningLogField("current_project", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">当前卡点</label>
              <Textarea value={learningLog.bottleneck} onChange={(event) => setLearningLogField("bottleneck", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">你当前的判断</label>
              <Textarea value={learningLog.current_judgment} onChange={(event) => setLearningLogField("current_judgment", event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-ink/55">希望我扮演的角色</label>
                <Input value={learningLog.requested_role} onChange={(event) => setLearningLogField("requested_role", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-xs text-ink/55">本次输出类型</label>
                <Input value={learningLog.output_type} onChange={(event) => setLearningLogField("output_type", event.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">当前输入焦点</label>
              <Textarea value={learningLog.current_input} onChange={(event) => setLearningLogField("current_input", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">回写目标</label>
              <Textarea value={learningLog.writeback_target} onChange={(event) => setLearningLogField("writeback_target", event.target.value)} />
            </div>
          </FieldCard>

          <FieldCard title="今日与本周回写" description="把结论写回规则、模板、项目宪法，而不是停留在知道。">
            <div>
              <label className="mb-2 block text-xs text-ink/55">今天要补的输入</label>
              <Textarea value={dailyFocus.input_focus} onChange={(event) => setDailyFocusField("input_focus", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">今天必须产出的输出</label>
              <Textarea value={dailyFocus.output_focus} onChange={(event) => setDailyFocusField("output_focus", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">本周新增规则</label>
              <Textarea value={weeklyReview.next_rule} onChange={(event) => setWeeklyReviewField("next_rule", event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">本周退役假设</label>
              <Textarea
                value={weeklyReview.retired_assumptions}
                onChange={(event) => setWeeklyReviewField("retired_assumptions", event.target.value)}
              />
            </div>
          </FieldCard>
        </div>

        <FieldCard title="核心资源入口" description="数量少一点，但必须够硬。">
          <div className="grid gap-3">
            {coreResources.map((resource) => (
              <Link key={resource.href} href={resource.href} target="_blank" className="rounded-2xl border border-ink/10 bg-white/75 p-4 transition hover:bg-canvas/70">
                <div className="font-medium text-ink">{resource.title}</div>
                <div className="mt-1 text-sm leading-6 text-ink/65">{resource.description}</div>
              </Link>
            ))}
          </div>
        </FieldCard>
      </div>
    </AppShell>
  );
}

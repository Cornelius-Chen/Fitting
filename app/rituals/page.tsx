"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ChecklistBlock } from "@/components/operating-system/checklist-block";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { Input } from "@/components/ui/input";
import { reminderTemplates } from "@/data/plan-content";
import { clamp } from "@/lib/utils";
import { usePlanStore } from "@/store/use-plan-store";
import { ReminderKey } from "@/types/plan";

export default function RitualsPage() {
  const planState = usePlanStore((state) => state.planState);
  const setReminderTime = usePlanStore((state) => state.setReminderTime);
  const toggleReminderItem = usePlanStore((state) => state.toggleReminderItem);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Rituals"
          title="三段提醒"
          description="起床、出门前、睡前三段分开管理。三段都不共享 checklist，因为它们服务的是完全不同的控制任务。"
        />

        <div className="grid gap-4 xl:grid-cols-3">
          {Object.values(reminderTemplates).map((template) => {
            const key = template.key as ReminderKey;
            const checks = planState.reminder_checks[key];
            const progress = clamp((Object.values(checks).filter(Boolean).length / template.items.length) * 100);

            return (
              <FieldCard key={template.key} title={template.title} description={template.reason}>
                <div>
                  <label className="mb-2 block text-xs text-ink/55">提醒时间</label>
                  <Input
                    type="time"
                    value={planState.reminder_times[key]}
                    onChange={(event) => setReminderTime(key, event.target.value)}
                  />
                </div>
                <ChecklistBlock items={template.items} checks={checks} onToggle={(id) => toggleReminderItem(key, id)} progress={progress} />
              </FieldCard>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

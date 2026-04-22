"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { usePlanStore } from "@/store/use-plan-store";

export default function HistoryPage() {
  const reports = usePlanStore((state) => state.reports);
  const trendData = [...reports]
    .slice()
    .reverse()
    .map((item) => ({
      date: item.report_date,
      score: item.score,
      appearance: item.appearance_score,
      behavior: item.behavior_score,
      social: item.social_score,
      inner: item.inner_score,
      learning: item.learning_score,
    }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="History"
          title="历史复盘"
          description="日报不是为了记流水账，而是为了看系统是否越来越稳、哪些规则真的留下来了。"
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <FieldCard title="综合分趋势">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#205c44" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FieldCard>
          <FieldCard title="系统分趋势">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="appearance" stroke="#e8a64c" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="behavior" stroke="#205c44" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="social" stroke="#6f8b4a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="inner" stroke="#13231a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="learning" stroke="#b36a2e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FieldCard>
        </div>

        <FieldCard title="历史日报列表" description="先看最近几天有没有真正把闭环跑起来。">
          <div className="space-y-3">
            {reports.map((item) => (
              <div key={item.id} className="rounded-2xl border border-ink/10 bg-white/75 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium text-ink">
                    第 {item.week} 周 · Day {item.day} · {item.report_date}
                  </div>
                  <div className="rounded-full bg-canvas px-3 py-1 text-xs text-ink/70">{item.cadence_status}</div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-ink/70 md:grid-cols-5">
                  <div>综合分：{item.score}</div>
                  <div>外表：{item.appearance_score}</div>
                  <div>行为：{item.behavior_score}</div>
                  <div>社交：{item.social_score}</div>
                  <div>内在 / 学习：{item.inner_score} / {item.learning_score}</div>
                </div>
                <div className="mt-2 text-sm leading-6 text-ink/65">{item.note}</div>
              </div>
            ))}
          </div>
        </FieldCard>
      </div>
    </AppShell>
  );
}

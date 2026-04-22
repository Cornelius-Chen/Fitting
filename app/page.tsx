"use client";

import { AppShell } from "@/components/layout/app-shell";
import { MetricCard, PageIntro, ScoreCard, SectionList } from "@/components/operating-system/sections";
import { coreResources, dialogueRoles, systemBlueprints } from "@/data/plan-content";
import { usePlanSelectors, usePlanStore, useSyncState } from "@/store/use-plan-store";

export default function HomePage() {
  const { overallScore, reminderCompletion, systemScores, phaseInfo, roadmapWeek, weeklyAverage } = usePlanSelectors();
  const profile = usePlanStore((state) => state.profile);
  const planState = usePlanStore((state) => state.planState);
  const { syncEnabled } = useSyncState();
  const stockTasks = planState.stock_tasks ?? [];
  const stockEntries = planState.stock_entries ?? [];
  const activeTaskId = planState.stock_active_task_id ?? null;

  const activeTask = stockTasks.find((task) => task.id === activeTaskId) ?? stockTasks[0] ?? null;
  const activeTaskEntries = activeTask ? stockEntries.filter((entry) => entry.taskId === activeTask.id) : [];
  const latestStock = activeTask
    ? activeTaskEntries
        .sort((a, b) => (a.date > b.date ? 1 : -1))
        .reduce((amount, entry) => amount * (1 + entry.returnRate / 100), activeTask.startAmount)
    : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="System Overview"
          title={`${profile.display_name} 的个人升级总控台`}
          description="这不是单点优化面板，而是把外表、行为、社交、内在、学习和项目协同接成一套长期可复利的个人操作系统。"
          aside={
            <div className="rounded-[24px] border border-ink/10 bg-canvas/70 p-4 text-sm leading-6 text-ink/70">
              <div className="font-medium text-ink">{phaseInfo.title}</div>
              <div className="mt-2">{phaseInfo.target}</div>
              <div className="mt-3 text-xs text-ink/55">当前周：第 {planState.current_week} 周</div>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="今日综合分" value={`${overallScore}`} detail="三段提醒 + 五大系统共同计算" />
          <MetricCard label="三段提醒完成度" value={`${reminderCompletion}%`} detail="起床 / 出门前 / 睡前三段独立计算" />
          <MetricCard label="当前周平均分" value={`${weeklyAverage || overallScore}`} detail="用来看这周执行是否越来越稳" />
          <MetricCard label="同步状态" value={syncEnabled ? "云端开启" : "本地模式"} detail="登录后可跨设备同步当前进度" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="股票当前任务"
            value={activeTask ? activeTask.title : "尚未创建"}
            detail={activeTask ? `${activeTask.startDate} 到 ${activeTask.endDate}` : "先去股票页创建第一个任务"}
          />
          <MetricCard
            label="股票当前净值"
            value={activeTask ? `${Math.round(latestStock).toLocaleString()}` : "--"}
            detail={
              activeTaskEntries.length
                ? `最近收益记录 ${activeTaskEntries.sort((a, b) => (a.date < b.date ? 1 : -1))[0].date}`
                : "当前任务还没有收益率记录"
            }
          />
          <MetricCard label="股票模块定位" value={`${stockTasks.length} 个任务`} detail="多任务分段推进，不允许时间重叠，只记录每日收益率" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Object.values(systemBlueprints).map((system) => (
            <ScoreCard key={system.key} title={system.title} score={systemScores[system.key]} detail={system.headline} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SectionList
            title="本周主提示"
            description="只抓最关键的方向，不让系统重新变散。"
            items={[
              { title: roadmapWeek?.theme ?? "先把节奏压稳", detail: roadmapWeek?.outcome ?? phaseInfo.focus },
              { title: "当前阶段目标", detail: phaseInfo.target },
              { title: "本周最该警惕", detail: roadmapWeek?.caution ?? "不要把系统做成又大又重的负担。" },
            ]}
          />
          <SectionList
            title="对话调用角色"
            description="以后和我讨论，最好不是泛聊，而是按角色调用。"
            items={dialogueRoles.map((role) => ({ title: role.name, detail: role.description }))}
          />
        </div>

        <SectionList
          title="当前外部校准入口"
          description="保留少量但硬的资源，不让输入重新失控。"
          items={coreResources.map((item) => ({ title: item.title, detail: item.description }))}
        />
      </div>
    </AppShell>
  );
}

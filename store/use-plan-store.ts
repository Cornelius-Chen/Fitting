"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createNewReportDate,
  createReportId,
  defaultProfile,
  getCurrentPhase,
  getDefaultDailyFocus,
  getDefaultLearningLog,
  getDefaultPlanState,
  getDefaultReminderChecks,
  getDefaultSystemChecks,
  getDefaultWeeklyReview,
  initialReports,
  phaseMeta,
  reminderTemplates,
  storageKeys,
  systemBlueprints,
  weeklyRoadmap,
} from "@/data/plan-content";
import { fetchBootstrap, updatePlanState, updateProfile, upsertDailyReport } from "@/lib/api-client";
import { clamp, debounce } from "@/lib/utils";
import {
  DailyFocusDraft,
  DailyReport,
  LearningLog,
  Profile,
  ReminderKey,
  StockReturnEntry,
  StockTask,
  SystemKey,
  UserPlanState,
  WeeklyReview,
} from "@/types/plan";

interface AuthState {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

interface PlanStore {
  auth: AuthState;
  initialized: boolean;
  loading: boolean;
  saving: boolean;
  profileSaving: boolean;
  syncEnabled: boolean;
  error: string | null;
  profile: Profile;
  planState: UserPlanState;
  reports: DailyReport[];
  setAuth: (payload: AuthState) => void;
  bootstrap: () => Promise<void>;
  setCurrentWeek: (week: number) => void;
  setReminderTime: (key: ReminderKey, value: string) => void;
  toggleReminderItem: (key: ReminderKey, itemId: string) => void;
  toggleSystemCheck: (key: SystemKey, itemId: string) => void;
  setDailyFocusField: <K extends keyof DailyFocusDraft>(field: K, value: DailyFocusDraft[K]) => void;
  setLearningLogField: <K extends keyof LearningLog>(field: K, value: LearningLog[K]) => void;
  setWeeklyReviewField: <K extends keyof WeeklyReview>(field: K, value: WeeklyReview[K]) => void;
  addStockTask: (task: Omit<StockTask, "id" | "createdAt" | "weeklyReview" | "monthlyReview">) => void;
  deleteStockTask: (id: string) => void;
  setActiveStockTask: (id: string | null) => void;
  setStockTaskReview: (taskId: string, field: "weeklyReview" | "monthlyReview", value: string) => void;
  addStockReturnEntry: (entry: Omit<StockReturnEntry, "id">) => void;
  removeStockReturnEntry: (id: string) => void;
  generateTodayPlan: () => void;
  saveDailyReport: () => Promise<void>;
  updateProfileField: <K extends keyof Profile>(field: K, value: Profile[K]) => void;
  persistProfile: () => Promise<void>;
  clearError: () => void;
}

const defaultAuth: AuthState = {
  userId: null,
  email: null,
  isAuthenticated: false,
};

const debouncedPlanStateSync = debounce(async (payload: UserPlanState) => {
  await updatePlanState(payload);
}, 800);

function queuePlanStateSync(get: () => PlanStore, payload: UserPlanState, set: (partial: Partial<PlanStore>) => void) {
  const state = get();

  if (!state.auth.isAuthenticated || !state.syncEnabled) {
    return;
  }

  try {
    debouncedPlanStateSync(payload);
  } catch (error) {
    set({
      syncEnabled: false,
      error: error instanceof Error ? error.message : "云端同步失败，当前继续使用本地缓存。",
    });
  }
}

function getCurrentDayIndex(date = new Date()) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function buildFreshDailyState(week: number) {
  return {
    reminder_checks: getDefaultReminderChecks(),
    system_checks: getDefaultSystemChecks(),
    daily_focus: getDefaultDailyFocus(week),
    learning_log: getDefaultLearningLog(),
  };
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      auth: defaultAuth,
      initialized: false,
      loading: false,
      saving: false,
      profileSaving: false,
      syncEnabled: true,
      error: null,
      profile: defaultProfile,
      planState: getDefaultPlanState(),
      reports: initialReports,
      setAuth: (payload) => {
        set({ auth: payload, initialized: payload.isAuthenticated ? get().initialized : true });
      },
      bootstrap: async () => {
        if (!get().auth.isAuthenticated) {
          set({ initialized: true, syncEnabled: false });
          return;
        }

        set({ loading: true, error: null, syncEnabled: true });

        try {
          const payload = await fetchBootstrap();
          set({
            initialized: true,
            loading: false,
            profile: payload.profile,
            planState: payload.planState,
            reports: payload.reports,
            syncEnabled: true,
          });
        } catch (error) {
          set({
            initialized: true,
            loading: false,
            syncEnabled: false,
            error: error instanceof Error ? error.message : "云端初始化失败，已回退到本地缓存。",
          });
        }
      },
      setCurrentWeek: (week) => {
        const next = {
          ...get().planState,
          current_week: week,
          ...buildFreshDailyState(week),
          weekly_review: getDefaultWeeklyReview(),
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      setReminderTime: (key, value) => {
        const next = {
          ...get().planState,
          reminder_times: {
            ...get().planState.reminder_times,
            [key]: value,
          },
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      toggleReminderItem: (key, itemId) => {
        const next = {
          ...get().planState,
          reminder_checks: {
            ...get().planState.reminder_checks,
            [key]: {
              ...get().planState.reminder_checks[key],
              [itemId]: !get().planState.reminder_checks[key][itemId],
            },
          },
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      toggleSystemCheck: (key, itemId) => {
        const next = {
          ...get().planState,
          system_checks: {
            ...get().planState.system_checks,
            [key]: {
              ...get().planState.system_checks[key],
              [itemId]: !get().planState.system_checks[key][itemId],
            },
          },
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      setDailyFocusField: (field, value) => {
        const next = {
          ...get().planState,
          daily_focus: {
            ...get().planState.daily_focus,
            [field]: value,
          },
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      setLearningLogField: (field, value) => {
        const next = {
          ...get().planState,
          learning_log: {
            ...get().planState.learning_log,
            [field]: value,
          },
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      setWeeklyReviewField: (field, value) => {
        const next = {
          ...get().planState,
          weekly_review: {
            ...get().planState.weekly_review,
            [field]: value,
          },
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      addStockTask: (task) => {
        const nextTask: StockTask = {
          id: `stock-task-${Date.now()}`,
          createdAt: new Date().toISOString(),
          weeklyReview: "",
          monthlyReview: "",
          ...task,
        };
        const next = {
          ...get().planState,
          stock_tasks: [...get().planState.stock_tasks, nextTask].sort((a, b) => (a.startDate > b.startDate ? 1 : -1)),
          stock_active_task_id: nextTask.id,
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      deleteStockTask: (id) => {
        const remainingTasks = get().planState.stock_tasks.filter((task) => task.id !== id);
        const next = {
          ...get().planState,
          stock_tasks: remainingTasks,
          stock_entries: get().planState.stock_entries.filter((entry) => entry.taskId !== id),
          stock_active_task_id:
            get().planState.stock_active_task_id === id ? (remainingTasks[0]?.id ?? null) : get().planState.stock_active_task_id,
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      setActiveStockTask: (id) => {
        const next = {
          ...get().planState,
          stock_active_task_id: id,
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      setStockTaskReview: (taskId, field, value) => {
        const next = {
          ...get().planState,
          stock_tasks: get().planState.stock_tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)),
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      addStockReturnEntry: (entry) => {
        const nextEntry: StockReturnEntry = {
          id: `${entry.taskId}-${entry.date}-${Date.now()}`,
          ...entry,
        };
        const next = {
          ...get().planState,
          stock_entries: [
            nextEntry,
            ...get().planState.stock_entries.filter((item) => !(item.taskId === entry.taskId && item.date === entry.date)),
          ],
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      removeStockReturnEntry: (id) => {
        const next = {
          ...get().planState,
          stock_entries: get().planState.stock_entries.filter((item) => item.id !== id),
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      generateTodayPlan: () => {
        const state = get();
        const week = state.planState.current_week;
        const next = {
          ...state.planState,
          ...buildFreshDailyState(week),
          stock_tasks: state.planState.stock_tasks ?? [],
          stock_entries: state.planState.stock_entries ?? [],
          stock_active_task_id: state.planState.stock_active_task_id ?? null,
          today_generated_at: new Date().toLocaleString("zh-CN"),
        };
        set({ planState: next });
        queuePlanStateSync(get, next, set);
      },
      saveDailyReport: async () => {
        const state = get();
        const metrics = getPlanMetrics(state.profile, state.planState, state.reports);
        const entry: DailyReport = {
          id: createReportId(state.planState.current_week, getCurrentDayIndex()),
          week: state.planState.current_week,
          day: getCurrentDayIndex(),
          report_date: createNewReportDate(),
          score: metrics.overallScore,
          appearance_score: metrics.systemScores.appearance,
          behavior_score: metrics.systemScores.behavior,
          social_score: metrics.systemScores.social,
          inner_score: metrics.systemScores.inner,
          learning_score: metrics.systemScores.learning,
          cadence_status:
            metrics.overallScore >= 80 ? "稳定推进" : metrics.overallScore >= 60 ? "主体保住了" : "需要收拢重建",
          note: state.planState.daily_focus.note,
          snapshot: {
            reminder_completion: metrics.reminderCompletion,
            system_scores: metrics.systemScores,
            daily_focus: state.planState.daily_focus,
            learning_log: state.planState.learning_log,
          },
        };

        set({ saving: true, error: null });

        try {
          const saved = state.auth.isAuthenticated && state.syncEnabled ? await upsertDailyReport(entry) : entry;

          set({
            saving: false,
            reports: [saved, ...state.reports.filter((item) => item.id !== saved.id)],
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : "日报保存失败，已保留本地版本。",
            reports: [entry, ...state.reports.filter((item) => item.id !== entry.id)],
          });
        }
      },
      updateProfileField: (field, value) => {
        set({
          profile: {
            ...get().profile,
            [field]: value,
          },
        });
      },
      persistProfile: async () => {
        const state = get();
        set({ profileSaving: true, error: null });

        try {
          if (state.auth.isAuthenticated && state.syncEnabled) {
            await updateProfile(state.profile);
          }

          set({ profileSaving: false });
        } catch (error) {
          set({
            profileSaving: false,
            error: error instanceof Error ? error.message : "个人资料保存失败。",
          });
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: storageKeys.app,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PlanStore> | undefined;
        const persistedPlanState = persisted?.planState as Partial<UserPlanState> | undefined;

        return {
          ...currentState,
          ...persisted,
          profile: {
            ...currentState.profile,
            ...(persisted?.profile ?? {}),
          },
          planState: {
            ...getDefaultPlanState(),
            ...currentState.planState,
            ...(persistedPlanState ?? {}),
            reminder_times: {
              ...getDefaultPlanState().reminder_times,
              ...(persistedPlanState?.reminder_times ?? {}),
            },
            reminder_checks: {
              ...getDefaultPlanState().reminder_checks,
              ...(persistedPlanState?.reminder_checks ?? {}),
            },
            system_checks: {
              ...getDefaultPlanState().system_checks,
              ...(persistedPlanState?.system_checks ?? {}),
            },
            daily_focus: {
              ...getDefaultPlanState().daily_focus,
              ...(persistedPlanState?.daily_focus ?? {}),
            },
            learning_log: {
              ...getDefaultPlanState().learning_log,
              ...(persistedPlanState?.learning_log ?? {}),
            },
            weekly_review: {
              ...getDefaultPlanState().weekly_review,
              ...(persistedPlanState?.weekly_review ?? {}),
            },
            stock_tasks: persistedPlanState?.stock_tasks ?? currentState.planState.stock_tasks,
            stock_entries: persistedPlanState?.stock_entries ?? currentState.planState.stock_entries,
            stock_active_task_id:
              persistedPlanState?.stock_active_task_id ?? currentState.planState.stock_active_task_id,
          },
          reports: persisted?.reports ?? currentState.reports,
        };
      },
      partialize: (state) => ({
        profile: state.profile,
        planState: state.planState,
        reports: state.reports,
      }),
    },
  ),
);

export function getPlanMetrics(profile: Profile, planState: UserPlanState, reports: DailyReport[]) {
  const reminderEntries = Object.entries(reminderTemplates);
  const totalReminderItems = reminderEntries.reduce((sum, [, template]) => sum + template.items.length, 0);
  const completedReminderItems = reminderEntries.reduce(
    (sum, [key]) => sum + Object.values(planState.reminder_checks[key as ReminderKey]).filter(Boolean).length,
    0,
  );
  const reminderCompletion = totalReminderItems ? clamp((completedReminderItems / totalReminderItems) * 100) : 0;

  const systemScores = Object.fromEntries(
    Object.entries(systemBlueprints).map(([key, blueprint]) => {
      const checks = planState.system_checks[key as SystemKey];
      const completed = Object.values(checks).filter(Boolean).length;
      const score = blueprint.items.length ? clamp((completed / blueprint.items.length) * 100) : 0;
      return [key, score];
    }),
  ) as Record<SystemKey, number>;

  const overallScore = clamp(
    reminderCompletion * 0.3 +
      systemScores.appearance * 0.14 +
      systemScores.behavior * 0.2 +
      systemScores.social * 0.14 +
      systemScores.inner * 0.11 +
      systemScores.learning * 0.11,
  );

  const phase = getCurrentPhase(planState.current_week);
  const currentWeekReports = reports.filter((item) => item.week === planState.current_week);
  const weeklyAverage = currentWeekReports.length
    ? Math.round(currentWeekReports.reduce((sum, item) => sum + item.score, 0) / currentWeekReports.length)
    : 0;

  const rhythmStatus =
    overallScore >= 80 ? "今天的控制层是稳定的。" : overallScore >= 60 ? "今天主体还在，但有些环节开始飘。" : "今天更适合切回保底模式。";

  return {
    phase,
    phaseInfo: phaseMeta[phase],
    roadmapWeek: weeklyRoadmap.find((item) => item.week === planState.current_week),
    reminderCompletion,
    systemScores,
    overallScore,
    weeklyAverage,
    rhythmStatus,
    totalReminderItems,
    completedReminderItems,
    currentWeekReports,
    profile,
    planState,
  };
}

export function usePlanSelectors() {
  const profile = usePlanStore((state) => state.profile);
  const planState = usePlanStore((state) => state.planState);
  const reports = usePlanStore((state) => state.reports);

  return getPlanMetrics(profile, planState, reports);
}

export function useAuthState() {
  return usePlanStore((state) => state.auth);
}

export function useSyncState() {
  return {
    initialized: usePlanStore((state) => state.initialized),
    loading: usePlanStore((state) => state.loading),
    saving: usePlanStore((state) => state.saving),
    profileSaving: usePlanStore((state) => state.profileSaving),
    syncEnabled: usePlanStore((state) => state.syncEnabled),
    error: usePlanStore((state) => state.error),
  };
}

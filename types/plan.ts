export type ReminderKey = "wake" | "leave" | "sleep";
export type SystemKey = "appearance" | "behavior" | "social" | "inner" | "learning";
export type PhaseKey = 1 | 2 | 3;

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
}

export interface ReminderTemplate {
  key: ReminderKey;
  title: string;
  defaultTime: string;
  reason: string;
  items: ChecklistItem[];
}

export interface SystemBlueprint {
  key: SystemKey;
  title: string;
  summary: string;
  headline: string;
  items: ChecklistItem[];
  reviewPrompts: string[];
}

export interface LearningTrack {
  id: string;
  title: string;
  goal: string;
  bullets: string[];
}

export interface ResourceLink {
  title: string;
  href: string;
  description: string;
}

export interface DialogueRole {
  name: string;
  description: string;
}

export interface WeeklyRoadmapItem {
  week: number;
  phase: PhaseKey;
  theme: string;
  outcome: string;
  caution: string;
}

export interface PhaseMeta {
  title: string;
  weeks: string;
  focus: string;
  target: string;
}

export interface Profile {
  id?: string;
  display_name: string;
  role: string;
  age: number;
  mission: string;
  sleep_target: number;
  focus_block_minutes: number;
  weekly_social_target: number;
}

export interface DailyFocusDraft {
  main_project: string;
  main_outcome: string;
  input_focus: string;
  output_focus: string;
  appearance_focus: string;
  behavior_focus: string;
  social_task: string;
  inner_task: string;
  low_power_floor: string;
  note: string;
  energy: number;
}

export interface LearningLog {
  current_project: string;
  bottleneck: string;
  current_judgment: string;
  requested_role: string;
  current_input: string;
  output_type: string;
  writeback_target: string;
}

export interface WeeklyReview {
  wins: string;
  drifts: string;
  retired_assumptions: string;
  next_rule: string;
  next_focus: string;
}

export type StockDurationUnit = "day" | "week" | "month" | "year";

export interface StockContribution {
  name: string;
  symbol: string | null;
  profitAmount: number | null;
  contributionRate: number | null;
}

export interface StockTask {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  durationValue: number;
  durationUnit: StockDurationUnit;
  startAmount: number;
  targetAmount: number;
  createdAt: string;
  weeklyReview: string;
  monthlyReview: string;
}

export interface StockReturnEntry {
  id: string;
  taskId: string;
  date: string;
  returnRate: number;
  note: string;
  profitAmount?: number | null;
  assetValue?: number | null;
  source?: "manual" | "photo_parse";
  sourceLabel?: string | null;
  benchmarkName?: string | null;
  benchmarkReturnRate?: number | null;
  screenshotPath?: string | null;
  screenshotUrl?: string | null;
  contributions?: StockContribution[];
}

export interface StockPhotoParseResult {
  screenshotDate: string | null;
  dailyReturnRate: number | null;
  dailyProfitAmount: number | null;
  totalAsset: number | null;
  benchmarkName: string | null;
  benchmarkReturnRate: number | null;
  contributions: StockContribution[];
  confidence: number | null;
  summary: string;
  sourceLabel: string | null;
  screenshotPath?: string | null;
  screenshotUrl?: string | null;
}

export interface UserPlanState {
  current_week: number;
  reminder_times: Record<ReminderKey, string>;
  reminder_checks: Record<ReminderKey, Record<string, boolean>>;
  system_checks: Record<SystemKey, Record<string, boolean>>;
  daily_focus: DailyFocusDraft;
  learning_log: LearningLog;
  weekly_review: WeeklyReview;
  stock_tasks: StockTask[];
  stock_entries: StockReturnEntry[];
  stock_active_task_id: string | null;
  today_generated_at: string | null;
}

export interface DailyReport {
  id: string;
  week: number;
  day: number;
  report_date: string;
  score: number;
  appearance_score: number;
  behavior_score: number;
  social_score: number;
  inner_score: number;
  learning_score: number;
  cadence_status: string;
  note: string;
  snapshot: {
    reminder_completion: number;
    system_scores: Record<SystemKey, number>;
    daily_focus: DailyFocusDraft;
    learning_log: LearningLog;
  };
}

export interface BootstrapPayload {
  profile: Profile;
  planState: UserPlanState;
  reports: DailyReport[];
}

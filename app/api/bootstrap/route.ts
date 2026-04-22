import { NextRequest, NextResponse } from "next/server";
import { defaultProfile, getDefaultPlanState, initialReports } from "@/data/plan-content";
import { requireApiUser } from "@/lib/server-auth";
import { BootstrapPayload, DailyReport, Profile, StockReturnEntry, StockTask, UserPlanState } from "@/types/plan";

function parseLegacyDurationText(value: string) {
  const read = (pattern: RegExp) => Number(value.match(pattern)?.[1] ?? 0);
  return {
    years: read(/(\d+)\s*年/),
    months: read(/(\d+)\s*个?月/),
    weeks: read(/(\d+)\s*周/),
    days: read(/(\d+)\s*天/),
  };
}

function buildLegacyEndDate(startDate: string, durationText: string) {
  const duration = parseLegacyDurationText(durationText);
  const date = new Date(`${startDate}T00:00:00`);
  date.setFullYear(date.getFullYear() + duration.years);
  date.setMonth(date.getMonth() + duration.months);
  date.setDate(date.getDate() + duration.weeks * 7 + duration.days - 1);
  return date.toISOString().slice(0, 10);
}

function buildLegacyTaskAndEntries(
  stockGoal: {
    startDate: string;
    durationText: string;
    startAmount: number;
    targetAmount: number;
  } | null | undefined,
  stockLedger:
    | Array<{
        id?: string;
        date: string;
        assetValue: number;
        note?: string;
      }>
    | null
    | undefined,
  stockReviewDraft:
    | {
        weekly?: string;
        monthly?: string;
      }
    | null
    | undefined,
) {
  if (!stockGoal) {
    return {
      tasks: [] as StockTask[],
      entries: [] as StockReturnEntry[],
      activeTaskId: null as string | null,
    };
  }

  const taskId = "legacy-stock-task";
  const task: StockTask = {
    id: taskId,
    title: "默认股票任务",
    startDate: stockGoal.startDate,
    endDate: buildLegacyEndDate(stockGoal.startDate, stockGoal.durationText),
    durationValue: 1,
    durationUnit: "day",
    startAmount: stockGoal.startAmount,
    targetAmount: stockGoal.targetAmount,
    createdAt: new Date().toISOString(),
    weeklyReview: stockReviewDraft?.weekly ?? "",
    monthlyReview: stockReviewDraft?.monthly ?? "",
  };

  const sortedLedger = [...(stockLedger ?? [])].sort((a, b) => (a.date > b.date ? 1 : -1));
  let previousAmount = stockGoal.startAmount;

  const entries: StockReturnEntry[] = sortedLedger.map((item, index) => {
    const returnRate = previousAmount > 0 ? ((item.assetValue - previousAmount) / previousAmount) * 100 : 0;
    previousAmount = item.assetValue;

    return {
      id: item.id ?? `${taskId}-${item.date}-${index}`,
      taskId,
      date: item.date,
      returnRate,
      note: item.note ?? "",
    };
  });

  return {
    tasks: [task],
    entries,
    activeTaskId: taskId,
  };
}

function mapPlanStateRow(row: {
  selected_week: number | null;
  meal_selection: UserPlanState["reminder_times"] | null;
  checklist: UserPlanState["reminder_checks"] | null;
  exercise_checks: UserPlanState["system_checks"] | null;
  daily_log_draft: UserPlanState["daily_focus"] | null;
  grocery_checks_by_week:
    | {
        learning_log?: UserPlanState["learning_log"];
        weekly_review?: UserPlanState["weekly_review"];
        stock_tasks?: UserPlanState["stock_tasks"];
        stock_entries?: UserPlanState["stock_entries"];
        stock_active_task_id?: UserPlanState["stock_active_task_id"];
        stock_goal?: {
          startDate: string;
          durationText: string;
          startAmount: number;
          targetAmount: number;
        };
        stock_ledger?: Array<{
          id?: string;
          date: string;
          assetValue: number;
          note?: string;
        }>;
        stock_review_draft?: {
          weekly?: string;
          monthly?: string;
        };
      }
    | null;
  today_generated_at: string | null;
} | null): UserPlanState {
  const fallback = getDefaultPlanState();

  if (!row) {
    return fallback;
  }

  const migratedLegacy = buildLegacyTaskAndEntries(
    row.grocery_checks_by_week?.stock_goal,
    row.grocery_checks_by_week?.stock_ledger,
    row.grocery_checks_by_week?.stock_review_draft,
  );

  return {
    current_week: row.selected_week ?? fallback.current_week,
    reminder_times: row.meal_selection ?? fallback.reminder_times,
    reminder_checks: row.checklist ?? fallback.reminder_checks,
    system_checks: row.exercise_checks ?? fallback.system_checks,
    daily_focus: row.daily_log_draft ?? fallback.daily_focus,
    learning_log: row.grocery_checks_by_week?.learning_log ?? fallback.learning_log,
    weekly_review: row.grocery_checks_by_week?.weekly_review ?? fallback.weekly_review,
    stock_tasks: row.grocery_checks_by_week?.stock_tasks ?? migratedLegacy.tasks ?? fallback.stock_tasks,
    stock_entries: row.grocery_checks_by_week?.stock_entries ?? migratedLegacy.entries ?? fallback.stock_entries,
    stock_active_task_id:
      row.grocery_checks_by_week?.stock_active_task_id ?? migratedLegacy.activeTaskId ?? fallback.stock_active_task_id,
    today_generated_at: row.today_generated_at ?? fallback.today_generated_at,
  };
}

function mapReportRow(row: {
  week: number;
  day: number;
  report_date: string;
  score: number;
  weight: number | null;
  steps: number | null;
  protein: number | null;
  sleep: number | null;
  workout_status: string | null;
  note: string | null;
  snapshot: DailyReport["snapshot"] | null;
}): DailyReport {
  return {
    id: `week-${row.week}-day-${row.day}`,
    week: row.week,
    day: row.day,
    report_date: row.report_date,
    score: row.score,
    appearance_score: row.weight ?? 0,
    behavior_score: row.steps ?? 0,
    social_score: row.protein ?? 0,
    inner_score: row.sleep ?? 0,
    learning_score: row.snapshot?.system_scores.learning ?? 0,
    cadence_status: row.workout_status ?? "已记录",
    note: row.note ?? "",
    snapshot: row.snapshot ?? initialReports[0].snapshot,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);

  if ("error" in auth) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const { client, user } = auth;

  const [{ data: profileRow }, { data: planStateRow }, { data: reportRows }] = await Promise.all([
    client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    client.from("user_plan_state").select("*").eq("user_id", user.id).maybeSingle(),
    client.from("daily_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  if (!profileRow) {
    await client.from("profiles").upsert({
      id: user.id,
      display_name: defaultProfile.display_name,
      sex: defaultProfile.role,
      age: defaultProfile.age,
      height_cm: 0,
      weight_kg: 0,
      goal: defaultProfile.mission,
      target_calories_train: 0,
      target_calories_rest: 0,
      protein: defaultProfile.weekly_social_target,
      fat: 0,
      carbs_train: 0,
      carbs_rest: 0,
      steps: defaultProfile.focus_block_minutes,
      water: 0,
      sleep: defaultProfile.sleep_target,
    });
  }

  if (!planStateRow) {
    const defaults = getDefaultPlanState();
    await client.from("user_plan_state").upsert({
      user_id: user.id,
      selected_week: defaults.current_week,
      selected_day: 1,
      meal_selection: defaults.reminder_times,
      checklist: defaults.reminder_checks,
      exercise_checks: defaults.system_checks,
      daily_log_draft: defaults.daily_focus,
      grocery_checks_by_week: {
        learning_log: defaults.learning_log,
        weekly_review: defaults.weekly_review,
        stock_tasks: defaults.stock_tasks,
        stock_entries: defaults.stock_entries,
        stock_active_task_id: defaults.stock_active_task_id,
      },
      today_generated_at: defaults.today_generated_at,
    });
  }

  const profile: Profile = profileRow
    ? {
        id: profileRow.id,
        display_name: profileRow.display_name ?? defaultProfile.display_name,
        role: profileRow.sex ?? defaultProfile.role,
        age: profileRow.age ?? defaultProfile.age,
        mission: profileRow.goal ?? defaultProfile.mission,
        sleep_target: profileRow.sleep ?? defaultProfile.sleep_target,
        focus_block_minutes: profileRow.steps ?? defaultProfile.focus_block_minutes,
        weekly_social_target: profileRow.protein ?? defaultProfile.weekly_social_target,
      }
    : defaultProfile;

  const planState = mapPlanStateRow(planStateRow as Parameters<typeof mapPlanStateRow>[0]);
  const reports = reportRows?.length ? reportRows.map((row) => mapReportRow(row)) : initialReports;

  const payload: BootstrapPayload = {
    profile,
    planState,
    reports,
  };

  return NextResponse.json(payload);
}

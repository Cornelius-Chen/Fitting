import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { UserPlanState } from "@/types/plan";

export async function PUT(request: NextRequest) {
  const auth = await requireApiUser(request);

  if ("error" in auth) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const payload = (await request.json()) as UserPlanState;
  const { client, user } = auth;

  const { error } = await client.from("user_plan_state").upsert({
    user_id: user.id,
    selected_week: payload.current_week,
    selected_day: 1,
    meal_selection: payload.reminder_times,
    checklist: payload.reminder_checks,
    exercise_checks: payload.system_checks,
    daily_log_draft: payload.daily_focus,
    grocery_checks_by_week: {
      learning_log: payload.learning_log,
      weekly_review: payload.weekly_review,
      stock_tasks: payload.stock_tasks,
      stock_entries: payload.stock_entries,
      stock_active_task_id: payload.stock_active_task_id,
    },
    today_generated_at: payload.today_generated_at,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

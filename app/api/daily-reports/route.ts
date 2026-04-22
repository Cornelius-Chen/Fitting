import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { DailyReport } from "@/types/plan";

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
    snapshot: row.snapshot ?? {
      reminder_completion: 0,
      system_scores: {
        appearance: 0,
        behavior: 0,
        social: 0,
        inner: 0,
        learning: 0,
      },
      daily_focus: {
        main_project: "",
        main_outcome: "",
        input_focus: "",
        output_focus: "",
        appearance_focus: "",
        behavior_focus: "",
        social_task: "",
        inner_task: "",
        low_power_floor: "",
        note: "",
        energy: 0,
      },
      learning_log: {
        current_project: "",
        bottleneck: "",
        current_judgment: "",
        requested_role: "",
        current_input: "",
        output_type: "",
        writeback_target: "",
      },
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);

  if ("error" in auth) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const week = request.nextUrl.searchParams.get("week");
  let query = auth.client.from("daily_reports").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false });

  if (week) {
    query = query.eq("week", Number(week));
  }

  const { data, error } = await query;

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json((data ?? []).map((row) => mapReportRow(row)));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);

  if ("error" in auth) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const payload = (await request.json()) as DailyReport;
  const { client, user } = auth;

  const { data, error } = await client
    .from("daily_reports")
    .upsert(
      {
        user_id: user.id,
        week: payload.week,
        day: payload.day,
        report_date: payload.report_date,
        score: payload.score,
        weight: payload.appearance_score,
        steps: payload.behavior_score,
        protein: payload.social_score,
        sleep: payload.inner_score,
        workout_status: payload.cadence_status,
        note: payload.note,
        snapshot: payload.snapshot,
      },
      { onConflict: "user_id,week,day" },
    )
    .select()
    .single();

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json(mapReportRow(data));
}

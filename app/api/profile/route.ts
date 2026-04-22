import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { Profile } from "@/types/plan";

export async function PUT(request: NextRequest) {
  const auth = await requireApiUser(request);

  if ("error" in auth) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const payload = (await request.json()) as Profile;
  const { client, user } = auth;

  const { error } = await client.from("profiles").upsert({
    id: user.id,
    display_name: payload.display_name,
    sex: payload.role,
    age: payload.age,
    height_cm: 0,
    weight_kg: 0,
    goal: payload.mission,
    target_calories_train: 0,
    target_calories_rest: 0,
    protein: payload.weekly_social_target,
    fat: 0,
    carbs_train: 0,
    carbs_rest: 0,
    steps: payload.focus_block_minutes,
    water: 0,
    sleep: payload.sleep_target,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

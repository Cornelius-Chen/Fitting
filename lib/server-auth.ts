import { NextRequest } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function requireApiUser(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase 未配置", status: 503 as const };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: "缺少认证令牌", status: 401 as const };
  }

  const client = getSupabaseServerClient(token);

  if (!client) {
    return { error: "Supabase 未配置", status: 503 as const };
  }

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    return { error: "登录状态无效", status: 401 as const };
  }

  return { client, user: data.user, token };
}

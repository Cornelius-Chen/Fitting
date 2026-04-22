"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setSubmitting(false);
      setMessage("当前没有配置 Supabase 环境变量，这一页无法连接云端。");
      return;
    }

    const action =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;
    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(mode === "signin" ? "登录成功，返回首页后会自动拉取云端数据。" : "注册成功，现在可以直接登录。");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-[28px] border-white/60 bg-white/85 shadow-soft">
        <CardHeader>
          <Link href="/" className="flex items-center gap-2 text-sm text-ink/55">
            <ArrowLeft className="h-4 w-4" />
            返回中控台
          </Link>
          <CardTitle className="mt-4 text-2xl text-ink">邮箱登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs text-ink/55">邮箱</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <Input className="pl-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">密码</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <Input className="pl-11" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1">
              <button
                type="button"
                className={`rounded-2xl px-3 py-2 text-sm ${mode === "signin" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}
                onClick={() => setMode("signin")}
              >
                登录
              </button>
              <button
                type="button"
                className={`rounded-2xl px-3 py-2 text-sm ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}
                onClick={() => setMode("signup")}
              >
                注册
              </button>
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "提交中..." : mode === "signin" ? "登录" : "创建账号"}
            </Button>
          </form>

          {message ? <div className="mt-4 rounded-2xl bg-canvas p-4 text-sm text-ink/70">{message}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}

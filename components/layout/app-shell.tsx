"use client";

import { PropsWithChildren, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, CloudOff, LogOut } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { appNavItems } from "@/lib/nav";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuthState, usePlanSelectors, usePlanStore, useSyncState } from "@/store/use-plan-store";

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const auth = useAuthState();
  const metrics = usePlanSelectors();
  const { initialized, loading, syncEnabled, error } = useSyncState();
  const setAuth = usePlanStore((state) => state.setAuth);
  const bootstrap = usePlanStore((state) => state.bootstrap);
  const clearError = usePlanStore((state) => state.clearError);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      bootstrap().catch(() => undefined);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setAuth({
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        isAuthenticated: Boolean(session?.user),
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        isAuthenticated: Boolean(session?.user),
      });
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [bootstrap, setAuth]);

  useEffect(() => {
    bootstrap().catch(() => undefined);
  }, [auth.isAuthenticated, bootstrap]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setAuth({ userId: null, email: null, isAuthenticated: false });
      return;
    }

    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen pb-28 lg:pb-10">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-80 overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur lg:flex lg:flex-col">
          <div className="rounded-[28px] bg-hero-glow p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine text-white">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink/70">Cornelius Operating System</div>
                <div className="text-lg font-semibold text-ink">个人升级中控台</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/70">
              把项目主轴、三段提醒、行为规则、社交推进、内在复盘和学习回写接成一个长期复利系统。
            </p>
            <div className="mt-4 rounded-2xl bg-white/75 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Current Read</div>
              <div className="mt-2 text-sm font-medium text-ink">{metrics.phaseInfo.title}</div>
              <div className="mt-1 text-sm text-ink/65">{metrics.phaseInfo.focus}</div>
            </div>
          </div>

          <nav className="mt-5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {appNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                    active ? "bg-pine text-white" : "text-ink/70 hover:bg-peach/40 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-4 rounded-[24px] border border-pine/10 bg-canvas/80 p-4">
            <div>
              <div className="text-sm font-medium text-ink">{auth.isAuthenticated ? auth.email : "未登录"}</div>
              <div className="mt-1 text-xs text-ink/60">
                {auth.isAuthenticated
                  ? syncEnabled
                    ? "当前开启云端同步。"
                    : "当前只使用本地缓存。"
                  : "登录后可在电脑和手机之间同步。"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <div className="text-xs text-ink/50">今日综合分</div>
              <div className="mt-1 text-3xl font-semibold text-ink">{metrics.overallScore}</div>
              <div className="mt-1 text-xs text-ink/60">{metrics.rhythmStatus}</div>
            </div>
            {auth.isAuthenticated ? (
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            ) : (
              <Link href="/auth/login" className="block">
                <Button className="w-full">去登录</Button>
              </Link>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex items-start justify-between gap-3 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-soft backdrop-blur lg:hidden">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-ink/45">Cornelius OS</div>
              <h1 className="text-xl font-semibold text-ink">个人升级中控台</h1>
            </div>
            {auth.isAuthenticated ? (
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            ) : (
              <Link href="/auth/login">
                <Button>登录</Button>
              </Link>
            )}
          </div>

          {!initialized || loading ? (
            <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-soft">正在同步你的个人系统数据…</div>
          ) : (
            <>
              {error ? (
                <div className="mb-4 flex items-start justify-between gap-3 rounded-[24px] border border-amber/30 bg-amber/15 p-4 text-sm text-ink">
                  <div className="flex items-start gap-3">
                    <CloudOff className="mt-0.5 h-4 w-4" />
                    <span>{error}</span>
                  </div>
                  <button className="text-xs text-ink/60" onClick={clearError}>
                    关闭
                  </button>
                </div>
              ) : null}
              {children}
            </>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

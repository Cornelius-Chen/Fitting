"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-soft">
      <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-ink/45">{eyebrow}</div>
          <h1 className="mt-3 text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">{description}</p>
        </div>
        {aside ? <div className="min-w-0 lg:max-w-sm">{aside}</div> : null}
      </CardContent>
    </Card>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="rounded-[24px] border-white/60 bg-white/85 shadow-soft">
      <CardContent className="p-5">
        <div className="text-sm text-ink/55">{label}</div>
        <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
        <div className="mt-1 text-xs text-ink/60">{detail}</div>
      </CardContent>
    </Card>
  );
}

export function ScoreCard({
  title,
  score,
  detail,
}: {
  title: string;
  score: number;
  detail: string;
}) {
  return (
    <Card className="rounded-[24px] border-white/60 bg-white/85 shadow-soft">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium text-ink">{title}</div>
          <div className="text-sm font-semibold text-ink">{score}%</div>
        </div>
        <Progress value={score} />
        <div className="text-xs text-ink/60">{detail}</div>
      </CardContent>
    </Card>
  );
}

export function SectionList({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: Array<{ title: string; detail: string }>;
}) {
  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-soft">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm leading-6 text-ink/65">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
            <div className="font-medium text-ink">{item.title}</div>
            <div className="mt-1 text-sm leading-6 text-ink/70">{item.detail}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FieldCard({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-soft">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm leading-6 text-ink/65">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

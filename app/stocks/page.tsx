"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PencilLine,
  Plus,
  ScanSearch,
  Target,
  Trash2,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { FieldCard, PageIntro } from "@/components/operating-system/sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AShareCalendarDay, fetchAShareCalendar, parseStockScreenshot } from "@/lib/api-client";
import { clamp } from "@/lib/utils";
import { usePlanStore } from "@/store/use-plan-store";
import { StockContribution, StockDurationUnit, StockReturnEntry, StockTask } from "@/types/plan";

type ManualContributionDraft = {
  id: string;
  name: string;
  symbol: string;
  weightPercent: string;
  stockReturnRate: string;
};

type ReviewMode = "weekly" | "monthly" | null;
type DetailView = "summary" | "heatmap" | "timeline";
type ArchiveView = "leaders" | "records";

const TRADING_DAYS_PER_WEEK = 5;
const TRADING_DAYS_PER_MONTH = 21;
const TRADING_DAYS_PER_YEAR = 252;

const durationUnitOptions: Array<{ value: StockDurationUnit; label: string }> = [
  { value: "day", label: "天" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "year", label: "年" },
];

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = parseDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatDate(next);
}

function addMonths(date: string, months: number) {
  const current = parseDate(date);
  current.setUTCMonth(current.getUTCMonth() + months, 1);
  return formatDate(current);
}

function getMonthStart(date: string) {
  const current = parseDate(date);
  current.setUTCDate(1);
  return formatDate(current);
}

function getMonthEnd(date: string) {
  const current = parseDate(date);
  return formatDate(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)));
}

function getWeekEnd(date: string) {
  const current = parseDate(date);
  const day = current.getUTCDay();
  const daysToSunday = (7 - day) % 7;
  current.setUTCDate(current.getUTCDate() + daysToSunday);
  return formatDate(current);
}

function getMonthLabel(date: string) {
  const current = parseDate(date);
  return `${current.getUTCFullYear()}年 ${current.getUTCMonth() + 1}月`;
}

function isWeekday(date: string) {
  const day = parseDate(date).getUTCDay();
  return day !== 0 && day !== 6;
}

function addDuration(startDate: string, durationValue: number, durationUnit: StockDurationUnit) {
  const date = parseDate(startDate);

  if (durationUnit === "day") {
    date.setUTCDate(date.getUTCDate() + durationValue - 1);
  } else if (durationUnit === "week") {
    date.setUTCDate(date.getUTCDate() + durationValue * 7 - 1);
  } else if (durationUnit === "month") {
    date.setUTCMonth(date.getUTCMonth() + durationValue);
    date.setUTCDate(date.getUTCDate() - 1);
  } else if (durationUnit === "year") {
    date.setUTCFullYear(date.getUTCFullYear() + durationValue);
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return formatDate(date);
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA <= endB && endA >= startB;
}

function formatMoney(value: number) {
  return Math.round(value).toLocaleString("zh-CN");
}

function formatMoneyCompact(value: number) {
  const abs = Math.abs(value);

  if (abs >= 100000000) {
    return `${(value / 100000000).toFixed(2).replace(/\.?0+$/, "")}亿`;
  }

  if (abs >= 10000) {
    return `${(value / 10000).toFixed(2).replace(/\.?0+$/, "")}万`;
  }

  return formatMoney(value);
}

function formatSignedMoney(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  const rounded = Math.round(value * 100) / 100;
  return `${rounded >= 0 ? "+" : ""}${rounded.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`;
}

function formatSignedPercent(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function deriveReturnRateFromProfitAmount(profitAmountText: string, assetValueText: string) {
  if (!profitAmountText.trim() || !assetValueText.trim()) {
    return null;
  }

  const profitAmount = Number(profitAmountText);
  const endingAssetValue = Number(assetValueText);

  if (!Number.isFinite(profitAmount) || !Number.isFinite(endingAssetValue)) {
    return null;
  }

  const openingAssetValue = endingAssetValue - profitAmount;
  if (!Number.isFinite(openingAssetValue) || openingAssetValue <= 0) {
    return null;
  }

  return (profitAmount / openingAssetValue) * 100;
}

function createManualContributionDraft(id: string): ManualContributionDraft {
  return { id, name: "", symbol: "", weightPercent: "", stockReturnRate: "" };
}

function getContributionKey(contribution: Pick<StockContribution, "name" | "symbol">) {
  return contribution.symbol?.trim() || contribution.name.trim();
}

function buildMonthGrid(displayMonth: string) {
  const monthStart = parseDate(getMonthStart(displayMonth));
  const offset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - offset);
  return Array.from({ length: 42 }, (_, index) => formatDate(new Date(gridStart.getTime() + index * 86400000)));
}

function getMonthCellTone(returnRate: number | null, open: boolean | null, selected: boolean) {
  if (selected) {
    return "border-pine ring-2 ring-pine/20";
  }
  if (open === null) {
    return "border-ink/10 bg-white";
  }
  if (!open) {
    return "border-ink/10 bg-slate-100 text-ink/45";
  }
  if (typeof returnRate !== "number") {
    return "border-ink/10 bg-white";
  }
  return returnRate >= 0
    ? "border-red-100 bg-red-50 text-red-700"
    : "border-blue-100 bg-blue-50 text-blue-700";
}

function getContributionTone(profitAmount: number | null | undefined, selected: boolean) {
  const base =
    typeof profitAmount === "number" && profitAmount < 0
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : "border-red-200 bg-red-50 text-red-800";
  return selected ? `${base} ring-2 ring-pine/20` : base;
}

function buildContributionHeatmap(contributions: StockContribution[]) {
  const filtered = contributions
    .map((item) => ({
      key: getContributionKey(item),
      name: item.name,
      symbol: item.symbol,
      profitAmount: item.profitAmount ?? 0,
      contributionRate: item.contributionRate ?? 0,
    }))
    .filter((item) => item.key);

  const maxAbs = Math.max(...filtered.map((item) => Math.abs(item.profitAmount)), 1);

  return filtered
    .sort((a, b) => Math.abs(b.profitAmount) - Math.abs(a.profitAmount))
    .map((item) => {
      const ratio = Math.max(0.2, Math.abs(item.profitAmount) / maxAbs);
      const colSpan = ratio > 0.7 ? 6 : ratio > 0.4 ? 4 : 3;
      const rowSpan = ratio > 0.7 ? 2 : 1;
      return { ...item, colSpan, rowSpan };
    });
}

function getTaskCurrentAmount(task: StockTask, entries: StockReturnEntry[]) {
  return [...entries]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .reduce((amount, entry) => amount * (1 + entry.returnRate / 100), task.startAmount);
}

function countTradingDaysWithFallback(calendarMap: Map<string, boolean>, start: string, end: string) {
  let count = 0;
  let cursor = start;

  while (cursor <= end) {
    const open = calendarMap.get(cursor) ?? isWeekday(cursor);
    if (open) {
      count += 1;
    }
    cursor = addDays(cursor, 1);
  }

  return count;
}

function getTradingFlagWithFallback(calendarMap: Map<string, boolean>, date: string, loading: boolean) {
  const resolved = calendarMap.get(date);
  if (typeof resolved === "boolean") {
    return resolved;
  }
  if (loading) {
    return null;
  }
  return isWeekday(date);
}

function getInitialSelectedDate(task: StockTask | null, today: string) {
  if (!task) {
    return today;
  }
  if (today < task.startDate) {
    return task.startDate;
  }
  if (today > task.endDate) {
    return task.endDate;
  }
  return today;
}

function StockMetricCard({ label, value, detail }: { label: string; value: ReactNode; detail: ReactNode }) {
  return (
    <Card className="rounded-[24px] border-white/60 bg-white/85 shadow-soft">
      <CardContent className="space-y-2 p-4">
        <div className="text-xs text-ink/50">{label}</div>
        <div className="min-w-0 truncate text-[clamp(1.1rem,2vw,1.85rem)] font-semibold leading-[1.08] tracking-tight text-ink [font-variant-numeric:tabular-nums]">
          {value}
        </div>
        <div className="text-xs leading-5 text-ink/60">{detail}</div>
      </CardContent>
    </Card>
  );
}

function ReviewPreviewCard({ title, value, onEdit }: { title: string; value: string; onEdit: () => void }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium text-ink">{title}</div>
        <Button variant="outline" className="rounded-xl" onClick={onEdit}>
          <PencilLine className="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>
      <div className="mt-3 text-sm leading-6 text-ink/70">{value}</div>
    </div>
  );
}

function ModalSurface({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "max-w-4xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-[28px] border border-white/60 bg-white/95 shadow-soft ${maxWidthClass}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink/10 bg-white/95 px-6 py-5">
          <div>
            <div className="text-xl font-semibold text-ink">{title}</div>
            {description ? <div className="mt-1 text-sm leading-6 text-ink/65">{description}</div> : null}
          </div>
          <Button variant="ghost" className="rounded-xl px-3" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function StocksPage() {
  const planState = usePlanStore((state) => state.planState);
  const addStockTask = usePlanStore((state) => state.addStockTask);
  const deleteStockTask = usePlanStore((state) => state.deleteStockTask);
  const setActiveStockTask = usePlanStore((state) => state.setActiveStockTask);
  const setStockTaskReview = usePlanStore((state) => state.setStockTaskReview);
  const addStockReturnEntry = usePlanStore((state) => state.addStockReturnEntry);
  const removeStockReturnEntry = usePlanStore((state) => state.removeStockReturnEntry);

  const stockTasks = planState.stock_tasks ?? [];
  const stockEntries = planState.stock_entries ?? [];
  const today = formatDate(new Date());

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const [detailView, setDetailView] = useState<DetailView>("summary");
  const [archiveView, setArchiveView] = useState<ArchiveView>("leaders");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskStartDate, setTaskStartDate] = useState(today);
  const [taskDurationValue, setTaskDurationValue] = useState("30");
  const [taskDurationUnit, setTaskDurationUnit] = useState<StockDurationUnit>("day");
  const [taskStartAmount, setTaskStartAmount] = useState("100000");
  const [taskTargetAmount, setTaskTargetAmount] = useState("150000");

  const activeTask = stockTasks.find((task) => task.id === planState.stock_active_task_id) ?? stockTasks[0] ?? null;

  const [selectedDate, setSelectedDate] = useState(getInitialSelectedDate(activeTask, today));
  const [displayMonth, setDisplayMonth] = useState(getMonthStart(activeTask ? getInitialSelectedDate(activeTask, today) : today));
  const [selectedContributionKey, setSelectedContributionKey] = useState<string | null>(null);

  const [entryDate, setEntryDate] = useState(getInitialSelectedDate(activeTask, today));
  const [entryReturnRate, setEntryReturnRate] = useState("");
  const [entryProfitAmount, setEntryProfitAmount] = useState("");
  const [entryAssetValue, setEntryAssetValue] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entrySource, setEntrySource] = useState<"manual" | "photo_parse">("manual");
  const [entrySourceLabel, setEntrySourceLabel] = useState<string | null>(null);
  const [entryBenchmarkName, setEntryBenchmarkName] = useState("");
  const [entryBenchmarkReturnRate, setEntryBenchmarkReturnRate] = useState("");
  const [entryScreenshotPath, setEntryScreenshotPath] = useState<string | null>(null);
  const [entryScreenshotUrl, setEntryScreenshotUrl] = useState<string | null>(null);
  const [entryContributions, setEntryContributions] = useState<StockContribution[]>([]);
  const [manualContributionDrafts, setManualContributionDrafts] = useState<ManualContributionDraft[]>([createManualContributionDraft(String(Date.now()))]);
  const [photoParsing, setPhotoParsing] = useState(false);
  const [photoParseError, setPhotoParseError] = useState<string | null>(null);
  const [photoParseResult, setPhotoParseResult] = useState<Awaited<ReturnType<typeof parseStockScreenshot>> | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarSource, setCalendarSource] = useState("本地 A 股交易日历");
  const [calendarDays, setCalendarDays] = useState<AShareCalendarDay[]>([]);

  useEffect(() => {
    const nextDate = getInitialSelectedDate(activeTask, today);
    setSelectedDate(nextDate);
    setDisplayMonth(getMonthStart(nextDate));
    setEntryDate(nextDate);
  }, [activeTask, today]);

  const calendarRange = useMemo(() => {
    const monthStart = getMonthStart(displayMonth);
    const monthEnd = addDays(getMonthEnd(displayMonth), 7);
    const taskStarts = stockTasks.map((task) => task.startDate).sort();
    const taskEnds = stockTasks.map((task) => task.endDate).sort();

    return {
      start: taskStarts[0] ? (taskStarts[0] < monthStart ? taskStarts[0] : monthStart) : monthStart,
      end: taskEnds.at(-1) ? (taskEnds.at(-1)! > monthEnd ? taskEnds.at(-1)! : monthEnd) : monthEnd,
    };
  }, [displayMonth, stockTasks]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setCalendarLoading(true);
        setCalendarError(null);
        const result = await fetchAShareCalendar(calendarRange.start, calendarRange.end);
        if (cancelled) {
          return;
        }
        setCalendarDays(result.days);
        setCalendarSource(result.source);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setCalendarError(error instanceof Error ? error.message : "交易日历加载失败");
        setCalendarDays([]);
      } finally {
        if (!cancelled) {
          setCalendarLoading(false);
        }
      }
    }

    run().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [calendarRange.end, calendarRange.start]);

  const calendarMap = useMemo(() => new Map(calendarDays.map((day) => [day.date, day.open])), [calendarDays]);

  const activeEntries = useMemo(
    () => (activeTask ? stockEntries.filter((entry) => entry.taskId === activeTask.id).sort((a, b) => (a.date > b.date ? -1 : 1)) : []),
    [activeTask, stockEntries],
  );
  const activeEntryMap = useMemo(() => new Map(activeEntries.map((entry) => [entry.date, entry])), [activeEntries]);
  const selectedEntry = activeEntryMap.get(selectedDate) ?? null;

  const taskStats = useMemo(() => {
    if (!activeTask) {
      return null;
    }

    const checkpoint = selectedDate < activeTask.startDate ? activeTask.startDate : selectedDate > activeTask.endDate ? activeTask.endDate : selectedDate;
    const tradingDays = countTradingDaysWithFallback(calendarMap, activeTask.startDate, activeTask.endDate);
    if (!tradingDays) {
      return null;
    }

    const elapsedTradingDays = Math.max(1, countTradingDaysWithFallback(calendarMap, activeTask.startDate, checkpoint));
    const growth = Math.pow(activeTask.targetAmount / activeTask.startAmount, 1 / tradingDays);
    const latestAmount = getTaskCurrentAmount(activeTask, activeEntries);
    const requiredNow = activeTask.startAmount * Math.pow(growth, elapsedTradingDays);
    const naturalWeekEnd = getWeekEnd(checkpoint);
    const weekEnd = naturalWeekEnd < activeTask.endDate ? naturalWeekEnd : activeTask.endDate;
    const monthEnd = getMonthEnd(checkpoint) < activeTask.endDate ? getMonthEnd(checkpoint) : activeTask.endDate;
    const weekTradingDays = countTradingDaysWithFallback(calendarMap, activeTask.startDate, weekEnd);
    const monthTradingDays = countTradingDaysWithFallback(calendarMap, activeTask.startDate, monthEnd);

    const progress = clamp(((latestAmount - activeTask.startAmount) / (activeTask.targetAmount - activeTask.startAmount)) * 100);
    const leadTradingDays = latestAmount > requiredNow ? Math.floor(Math.log(latestAmount / requiredNow) / Math.log(growth)) : 0;
    const lagTradingDays = latestAmount < requiredNow ? Math.floor(Math.log(requiredNow / latestAmount) / Math.log(growth)) : 0;

    return {
      tradingDays,
      elapsedTradingDays,
      latestAmount,
      latestEntryDate: activeEntries[0]?.date ?? null,
      requiredNow,
      weekTarget: activeTask.startAmount * Math.pow(growth, weekTradingDays),
      monthTarget: activeTask.startAmount * Math.pow(growth, monthTradingDays),
      dailyRate: growth - 1,
      weeklyRate: tradingDays >= TRADING_DAYS_PER_WEEK ? Math.pow(growth, TRADING_DAYS_PER_WEEK) - 1 : null,
      monthlyRate: tradingDays >= TRADING_DAYS_PER_MONTH ? Math.pow(growth, TRADING_DAYS_PER_MONTH) - 1 : null,
      annualRate: tradingDays >= TRADING_DAYS_PER_YEAR ? Math.pow(growth, TRADING_DAYS_PER_YEAR) - 1 : null,
      progress,
      leadTradingDays,
      lagTradingDays,
    };
  }, [activeEntries, activeTask, calendarMap, selectedDate]);

  const selectedOpen = getTradingFlagWithFallback(calendarMap, selectedDate, calendarLoading);
  const selectedOutsideTask = activeTask ? selectedDate < activeTask.startDate || selectedDate > activeTask.endDate : false;

  const manualContributionPreview = useMemo(() => {
    const assetValue = entryAssetValue.trim() && Number.isFinite(Number(entryAssetValue)) ? Number(entryAssetValue) : null;

    const rows = manualContributionDrafts
      .map((draft) => {
        if (!draft.weightPercent.trim() || !draft.stockReturnRate.trim()) {
          return null;
        }
        const weightPercent = Number(draft.weightPercent);
        const stockReturnRate = Number(draft.stockReturnRate);
        if (!Number.isFinite(weightPercent) || !Number.isFinite(stockReturnRate)) {
          return null;
        }
        const contributionRate = (weightPercent * stockReturnRate) / 100;
        const profitAmount = assetValue != null ? (assetValue * contributionRate) / 100 : null;
        return {
          id: draft.id,
          name: draft.name.trim() || "未命名股票",
          symbol: draft.symbol.trim() || null,
          weightPercent,
          stockReturnRate,
          contributionRate,
          profitAmount,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    return {
      rows,
      totalWeightPercent: rows.reduce((sum, row) => sum + row.weightPercent, 0),
      totalContributionRate: rows.reduce((sum, row) => sum + row.contributionRate, 0),
      totalProfitAmount: assetValue != null ? rows.reduce((sum, row) => sum + (row.profitAmount ?? 0), 0) : null,
    };
  }, [entryAssetValue, manualContributionDrafts]);

  const duplicateEntry = Boolean(activeTask && activeEntryMap.get(entryDate));
  const entryTradingFlag = getTradingFlagWithFallback(calendarMap, entryDate, calendarLoading);
  const isOutsideTaskRange = activeTask ? entryDate < activeTask.startDate || entryDate > activeTask.endDate : false;
  const derivedReturnRateFromAmount = deriveReturnRateFromProfitAmount(entryProfitAmount, entryAssetValue);

  const canSaveEntry = Boolean(
    activeTask &&
      !isOutsideTaskRange &&
      entryTradingFlag !== false &&
      (entryReturnRate.trim() !== "" || manualContributionPreview.rows.length > 0 || derivedReturnRateFromAmount != null),
  );

  const entryWriteHint = calendarLoading
    ? "交易日历加载中，先允许录入草稿。"
    : !activeTask
      ? "先创建任务，再记录收益。"
      : isOutsideTaskRange
        ? "日期超出当前任务范围。"
        : entryTradingFlag === false
          ? "当天是休市日，不能写入日收益。"
          : duplicateEntry
            ? "同日期记录会覆盖旧记录。"
            : "当前日期可写入收益记录。";

  const monthGrid = useMemo(() => buildMonthGrid(displayMonth), [displayMonth]);

  const displayedMonthSummary = useMemo(() => {
    if (!activeTask) {
      return null;
    }

    const displayMonthStart = getMonthStart(displayMonth);
    const displayMonthEnd = getMonthEnd(displayMonth);
    const windowStart = activeTask.startDate > displayMonthStart ? activeTask.startDate : displayMonthStart;
    const windowEnd = activeTask.endDate < displayMonthEnd ? activeTask.endDate : displayMonthEnd;

    if (windowStart > windowEnd) {
      return null;
    }

    const monthEntries = activeEntries.filter((entry) => entry.date >= windowStart && entry.date <= windowEnd);
    if (!monthEntries.length) {
      return null;
    }

    const amountBeforeWindow = activeEntries
      .filter((entry) => entry.date < windowStart)
      .reduce((amount, entry) => amount * (1 + entry.returnRate / 100), activeTask.startAmount);

    const monthGrowth = monthEntries.reduce((growth, entry) => growth * (1 + entry.returnRate / 100), 1);
    const endingAmount = amountBeforeWindow * monthGrowth;
    const profitAmount = endingAmount - amountBeforeWindow;

    return {
      returnRate: (monthGrowth - 1) * 100,
      profitAmount,
    };
  }, [activeEntries, activeTask, displayMonth]);

  const contributionTotals = useMemo(() => {
    const map = new Map<string, { key: string; name: string; symbol: string | null; profitAmount: number; contributionRate: number }>();
    for (const entry of activeEntries) {
      for (const contribution of entry.contributions ?? []) {
        const key = getContributionKey(contribution);
        const current = map.get(key);
        map.set(key, {
          key,
          name: contribution.name,
          symbol: contribution.symbol,
          profitAmount: (current?.profitAmount ?? 0) + (contribution.profitAmount ?? 0),
          contributionRate: (current?.contributionRate ?? 0) + (contribution.contributionRate ?? 0),
        });
      }
    }
    return [...map.values()].sort((a, b) => b.profitAmount - a.profitAmount);
  }, [activeEntries]);

  const contributionLeaders = contributionTotals.slice(0, 6);
  const contributionLaggards = [...contributionTotals].sort((a, b) => a.profitAmount - b.profitAmount).slice(0, 6);

  useEffect(() => {
    if (selectedContributionKey || !contributionTotals.length) {
      return;
    }
    setSelectedContributionKey(contributionTotals[0].key);
  }, [contributionTotals, selectedContributionKey]);

  const selectedContributionHistory = useMemo(() => {
    if (!selectedContributionKey) {
      return [];
    }

    return [...activeEntries]
      .map((entry) => {
        const contribution = (entry.contributions ?? []).find((item) => getContributionKey(item) === selectedContributionKey);
        if (!contribution) {
          return null;
        }
        return {
          date: entry.date,
          name: contribution.name,
          symbol: contribution.symbol,
          profitAmount: contribution.profitAmount ?? 0,
          contributionRate: contribution.contributionRate ?? 0,
          portfolioReturnRate: entry.returnRate,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [activeEntries, selectedContributionKey]);

  const selectedContributionSummary = selectedContributionHistory.at(-1) ?? null;
  const selectedContributionChart = useMemo(() => {
    let cumulative = 0;
    return selectedContributionHistory.map((item) => {
      cumulative += item.profitAmount;
      return { date: item.date.slice(5), cumulative, profitAmount: item.profitAmount };
    });
  }, [selectedContributionHistory]);

  const selectedContributionHeatmap = useMemo(() => buildContributionHeatmap(selectedEntry?.contributions ?? []), [selectedEntry]);
  const previewContributionHeatmap = useMemo(() => buildContributionHeatmap(photoParseResult?.contributions ?? []), [photoParseResult]);

  const proposedEndDate =
    taskStartDate && taskDurationValue && Number(taskDurationValue) > 0
      ? addDuration(taskStartDate, Number(taskDurationValue), taskDurationUnit)
      : null;

  const overlapTask =
    proposedEndDate != null
      ? stockTasks.find((task) => rangesOverlap(taskStartDate, proposedEndDate, task.startDate, task.endDate))
      : null;

  const canCreateTask = Boolean(
    taskTitle.trim() &&
      proposedEndDate &&
      Number(taskStartAmount) > 0 &&
      Number(taskTargetAmount) > Number(taskStartAmount) &&
      !overlapTask,
  );

  function resetTaskDraft() {
    setTaskTitle("");
    setTaskStartDate(today);
    setTaskDurationValue("30");
    setTaskDurationUnit("day");
    setTaskStartAmount("100000");
    setTaskTargetAmount("150000");
  }

  function resetEntryDraft() {
    const initialDate = getInitialSelectedDate(activeTask, today);
    setEntryDate(initialDate);
    setEntryReturnRate("");
    setEntryProfitAmount("");
    setEntryAssetValue("");
    setEntryNote("");
    setEntrySource("manual");
    setEntrySourceLabel(null);
    setEntryBenchmarkName("");
    setEntryBenchmarkReturnRate("");
    setEntryScreenshotPath(null);
    setEntryScreenshotUrl(null);
    setEntryContributions([]);
    setManualContributionDrafts([createManualContributionDraft(String(Date.now()))]);
    setPhotoParseError(null);
    setPhotoParseResult(null);
  }

  function handleCreateTask() {
    if (!canCreateTask || !proposedEndDate) {
      return;
    }
    addStockTask({
      title: taskTitle.trim(),
      startDate: taskStartDate,
      endDate: proposedEndDate,
      durationValue: Number(taskDurationValue),
      durationUnit: taskDurationUnit,
      startAmount: Number(taskStartAmount),
      targetAmount: Number(taskTargetAmount),
    });
    setTaskModalOpen(false);
    resetTaskDraft();
  }

  function openEntryModal(mode: "manual" | "photo" = "manual") {
    resetEntryDraft();
    setEntryModalOpen(true);
    if (mode === "photo") {
      window.setTimeout(() => photoInputRef.current?.click(), 120);
    }
  }

  async function handlePhotoParse(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !activeTask) {
      return;
    }

    try {
      setPhotoParsing(true);
      setPhotoParseError(null);
      const result = await parseStockScreenshot({
        file,
        taskTitle: activeTask.title,
        taskStartDate: activeTask.startDate,
        taskEndDate: activeTask.endDate,
      });

      setPhotoParseResult(result);
      if (result.screenshotDate) setEntryDate(result.screenshotDate);
      if (result.dailyReturnRate != null) setEntryReturnRate(String(result.dailyReturnRate));
      if (result.dailyProfitAmount != null) setEntryProfitAmount(String(result.dailyProfitAmount));
      if (result.totalAsset != null) setEntryAssetValue(String(result.totalAsset));
      setEntrySource("photo_parse");
      setEntrySourceLabel(result.sourceLabel);
      setEntryBenchmarkName(result.benchmarkName ?? "");
      setEntryBenchmarkReturnRate(result.benchmarkReturnRate != null ? String(result.benchmarkReturnRate) : "");
      setEntryScreenshotPath(result.screenshotPath ?? null);
      setEntryScreenshotUrl(result.screenshotUrl ?? null);
      setEntryContributions(result.contributions);
    } catch (error) {
      setPhotoParseError(error instanceof Error ? error.message : "截图识别失败");
    } finally {
      setPhotoParsing(false);
      event.target.value = "";
    }
  }

  function handleSaveEntry() {
    if (!activeTask || !canSaveEntry) {
      return;
    }

    const resolvedReturnRate =
      entryReturnRate.trim() !== "" && Number.isFinite(Number(entryReturnRate))
        ? Number(entryReturnRate)
        : manualContributionPreview.rows.length > 0
          ? manualContributionPreview.totalContributionRate
          : derivedReturnRateFromAmount ?? 0;

    const resolvedProfitAmount =
      entryProfitAmount.trim() !== "" && Number.isFinite(Number(entryProfitAmount))
        ? Number(entryProfitAmount)
        : manualContributionPreview.totalProfitAmount;

    const resolvedContributions =
      manualContributionPreview.rows.length > 0
        ? manualContributionPreview.rows.map((row) => ({
            name: row.name,
            symbol: row.symbol,
            profitAmount: row.profitAmount,
            contributionRate: row.contributionRate,
          }))
        : entryContributions;

    addStockReturnEntry({
      taskId: activeTask.id,
      date: entryDate,
      returnRate: resolvedReturnRate,
      note: entryNote,
      profitAmount: resolvedProfitAmount ?? null,
      assetValue: entryAssetValue.trim() ? Number(entryAssetValue) : null,
      source: entrySource,
      sourceLabel: entrySourceLabel,
      benchmarkName: entryBenchmarkName.trim() || null,
      benchmarkReturnRate: entryBenchmarkReturnRate.trim() ? Number(entryBenchmarkReturnRate) : null,
      screenshotPath: entryScreenshotPath,
      screenshotUrl: entryScreenshotUrl,
      contributions: resolvedContributions,
    });

    setSelectedDate(entryDate);
    setDisplayMonth(getMonthStart(entryDate));
    setArchiveView("records");
    setDetailView("summary");
    setEntryModalOpen(false);
    resetEntryDraft();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageIntro
          eyebrow="Stocks"
          title="股票任务账本"
          description="这页按完整工作流重排：上面管任务和动作，中间管目标与月历，下面管复盘和归档。日历现在走本地 A 股交易日历规则，不会再把未知日期全部打成休市。"
          aside={
            <div className="rounded-[24px] border border-ink/10 bg-canvas/70 p-4 text-sm leading-6 text-ink/70">
              <div className="font-medium text-ink">交易日历状态</div>
              <div className="mt-2">{calendarLoading ? "正在刷新交易日历..." : calendarError ? "日历加载失败，当前按工作日兜底" : calendarSource}</div>
              <div className="mt-2 text-xs text-ink/55">{calendarError ? calendarError : `${calendarRange.start} 到 ${calendarRange.end}`}</div>
            </div>
          }
        />

        <div className="grid gap-4 2xl:grid-cols-[1.08fr,0.92fr]">
          <FieldCard title="任务工作台" description="这里只负责任务切换与阶段边界。所有新建动作进弹窗，主页面只保留任务列表和当前阶段判断。">
            <div className="space-y-3">
              <Card className="rounded-[24px] border-white/60 bg-white/85 shadow-soft">
                <CardContent className="space-y-2 p-4">
                  <div className="text-xs text-ink/50">当前任务</div>
                  <div className="text-[clamp(1.5rem,2.6vw,2.3rem)] font-semibold leading-[1.08] tracking-tight text-ink">
                    {activeTask?.title ?? "未创建"}
                  </div>
                  <div className="text-sm leading-6 text-ink/60">
                    {activeTask ? `${activeTask.startDate} 到 ${activeTask.endDate}` : "先建一个阶段目标"}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                <StockMetricCard label="任务数量" value={stockTasks.length} detail="时间区间不允许重叠" />
                <StockMetricCard label="当前净值" value={activeTask && taskStats ? formatMoneyCompact(taskStats.latestAmount) : "--"} detail={taskStats?.latestEntryDate ? `完整值 ${formatMoney(taskStats.latestAmount)} · 最新记录 ${taskStats.latestEntryDate}` : "还没有日收益记录"} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-pine/15 bg-pine/5 p-4">
              <div>
                <div className="text-sm text-ink/55">任务原则</div>
                <div className="mt-1 text-sm leading-6 text-ink/70">任务可以首尾衔接，但不能时间重叠；任务开始后，起始资金不再改动，后续只追加每日收益。</div>
              </div>
              <Button className="rounded-2xl" onClick={() => setTaskModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建任务
              </Button>
            </div>

            <div className="space-y-3">
              {stockTasks.length ? (
                stockTasks.map((task) => {
                  const taskEntries = stockEntries.filter((entry) => entry.taskId === task.id);
                  const currentAmount = getTaskCurrentAmount(task, taskEntries);
                  const isActive = activeTask?.id === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveStockTask(task.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${isActive ? "border-pine bg-pine/5" : "border-ink/10 bg-white/75 hover:border-pine/25"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink" title={task.title}>{task.title}</div>
                          <div className="mt-1 text-sm text-ink/65">{task.startDate} 到 {task.endDate}</div>
                          <div className="mt-2 text-xs text-ink/55">起点 {formatMoney(task.startAmount)} / 终点 {formatMoney(task.targetAmount)} / 当前 {formatMoney(currentAmount)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs ${isActive ? "bg-pine text-white" : "bg-canvas text-ink/60"}`}>{isActive ? "当前任务" : "点击切换"}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-xl px-3 text-ink/60 hover:text-ink"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteStockTask(task.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-5 text-sm text-ink/55">还没有股票任务。先创建一个明确的阶段目标，再开始记账和复盘。</div>
              )}
            </div>
          </FieldCard>

          <FieldCard title="动作面板" description="这里只放最常用的动作。录入、截图识别和周月复盘都收进弹窗，不再把表单堆在主页面里。">
            {activeTask ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
                    <div className="text-xs text-ink/50">当前录入日期</div>
                    <div className="mt-1 text-lg font-semibold text-ink">{entryDate}</div>
                    <div className="mt-1 text-xs text-ink/55">{selectedOutsideTask ? "当前日期超出任务范围" : selectedOpen === false ? "当天休市" : selectedOpen === null ? "交易日历加载中" : "可作为录入基准日期"}</div>
                  </div>
                  <div className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
                    <div className="text-xs text-ink/50">写入提示</div>
                    <div className="mt-1 text-lg font-semibold text-ink">{duplicateEntry ? "会覆盖旧记录" : "可写入"}</div>
                    <div className="mt-1 text-xs text-ink/55">{entryWriteHint}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <StockMetricCard label="今日应达" value={taskStats ? formatMoneyCompact(taskStats.requiredNow) : "--"} detail={taskStats ? `完整值 ${formatMoney(taskStats.requiredNow)} · 按当前日期折算` : "按当前日期折算"} />
                  <StockMetricCard label="本周应达" value={taskStats ? formatMoneyCompact(taskStats.weekTarget) : "--"} detail={taskStats ? `完整值 ${formatMoney(taskStats.weekTarget)} · 按当前周折算` : "按当前周折算"} />
                  <div className="md:col-span-2">
                    <StockMetricCard label="本月应达" value={taskStats ? formatMoneyCompact(taskStats.monthTarget) : "--"} detail={taskStats ? `完整值 ${formatMoney(taskStats.monthTarget)} · 按当前月折算` : "按当前月折算"} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-2xl" onClick={() => openEntryModal("manual")}>
                    <Wallet className="mr-2 h-4 w-4" />
                    录入日收益
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => openEntryModal("photo")}>
                    <Camera className="mr-2 h-4 w-4" />
                    截图识别
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setReviewMode("weekly")}>周度复盘</Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setReviewMode("monthly")}>月度复盘</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-5 text-sm text-ink/55">先创建一个股票任务。任务建立后，这里会变成你的日常动作入口。</div>
            )}
          </FieldCard>
        </div>

        {activeTask ? (
          <>
            <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-soft">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-ink/55">任务区间</div>
                    <div className="mt-1 text-xs text-ink/60">{activeTask.startDate} 到 {activeTask.endDate}</div>
                  </div>
                  <div className="text-sm text-ink/55">当前净值 {taskStats ? formatMoney(taskStats.latestAmount) : "--"}</div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,auto,1fr] md:items-end">
                  <div>
                    <div className="text-xs text-ink/45">起点</div>
                    <div className="mt-1 text-[clamp(1.25rem,1.8vw,2rem)] font-semibold leading-none text-ink">{formatMoneyCompact(activeTask.startAmount)}</div>
                    <div className="mt-2 text-xs text-ink/55">完整值 {formatMoney(activeTask.startAmount)}</div>
                  </div>
                  <div className="hidden pb-2 text-ink/25 md:block">→</div>
                  <div className="md:text-right">
                    <div className="text-xs text-ink/45">终点</div>
                    <div className="mt-1 text-[clamp(1.25rem,1.8vw,2rem)] font-semibold leading-none text-ink">{formatMoneyCompact(activeTask.targetAmount)}</div>
                    <div className="mt-2 text-xs text-ink/55">完整值 {formatMoney(activeTask.targetAmount)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs text-ink/55">
                    <span>当前位于目标路径中的位置</span>
                    <span>{taskStats ? `${taskStats.progress}%` : "--"}</span>
                  </div>
                  <Progress value={taskStats?.progress ?? 0} />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 2xl:grid-cols-[1.02fr,0.98fr]">
              <FieldCard title="执行与目标" description="把目标路径、折算收益率和当前偏差放在一个大块里，避免信息在页面里到处散。">
                <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-ink">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      目标完成进度
                    </span>
                    <span>{taskStats ? `${taskStats.progress}%` : "--"}</span>
                  </div>
                  <Progress value={taskStats?.progress ?? 0} />
                  <div className="mt-3 text-xs leading-6 text-ink/60">当前净值 {taskStats ? formatMoney(taskStats.latestAmount) : "--"}，今天应达 {taskStats ? formatMoney(taskStats.requiredNow) : "--"}。</div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <StockMetricCard label="交易日日均" value={taskStats ? formatPercent(taskStats.dailyRate * 100) : "--"} detail="这是当前任务最直接的每日目标" />
                  <StockMetricCard label="周均折算" value={taskStats?.weeklyRate != null ? formatPercent(taskStats.weeklyRate * 100) : "--"} detail={taskStats ? (taskStats.tradingDays >= TRADING_DAYS_PER_WEEK ? "按 5 个交易日折算" : "任务未满 5 个交易日，不显示") : "等待任务数据"} />
                  <StockMetricCard label="月均折算" value={taskStats?.monthlyRate != null ? formatPercent(taskStats.monthlyRate * 100) : "--"} detail={taskStats ? (taskStats.tradingDays >= TRADING_DAYS_PER_MONTH ? "按 21 个交易日折算" : "任务未满 21 个交易日，不显示") : "等待任务数据"} />
                  <StockMetricCard label="年化折算" value={taskStats?.annualRate != null ? formatPercent(taskStats.annualRate * 100) : "--"} detail={taskStats ? (taskStats.tradingDays >= TRADING_DAYS_PER_YEAR ? "按 252 个交易日折算" : "任务未满 252 个交易日，不显示") : "等待任务数据"} />
                </div>
              </FieldCard>

              <FieldCard title="周月复盘" description="把周和月放在同一大块，只保留摘要和入口；具体填写仍然通过弹窗，页面不再拥挤。">
                <div className="space-y-3">
                  <ReviewPreviewCard title="周度复盘" value={activeTask.weeklyReview || "还没写周度复盘。建议只写本周最关键的偏差、做对的事和下一周必须执行的规则。"} onEdit={() => setReviewMode("weekly")} />
                  <ReviewPreviewCard title="月度复盘" value={activeTask.monthlyReview || "还没写月度复盘。这里更适合沉淀节奏判断、规则升级和哪些做法应该退场。"} onEdit={() => setReviewMode("monthly")} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
                    <div className="text-xs text-ink/50">本周应达</div>
                    <div className="mt-1 text-[clamp(1.2rem,1.9vw,1.8rem)] font-semibold text-ink">{taskStats ? formatMoneyCompact(taskStats.weekTarget) : "--"}</div>
                    <div className="mt-2 text-xs text-ink/55">{taskStats ? `完整值 ${formatMoney(taskStats.weekTarget)}` : "等待任务数据"}</div>
                  </div>
                  <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
                    <div className="text-xs text-ink/50">本月应达</div>
                    <div className="mt-1 text-[clamp(1.2rem,1.9vw,1.8rem)] font-semibold text-ink">{taskStats ? formatMoneyCompact(taskStats.monthTarget) : "--"}</div>
                    <div className="mt-2 text-xs text-ink/55">{taskStats ? `完整值 ${formatMoney(taskStats.monthTarget)}` : "等待任务数据"}</div>
                  </div>
                </div>
              </FieldCard>
            </div>

            <FieldCard title="月度收益日历" description="月历单独占一整块。你只需要在这里选日期，然后往下看当天的复盘详情。">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-xl px-3" onClick={() => setDisplayMonth(getMonthStart(addMonths(displayMonth, -1)))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink">{getMonthLabel(displayMonth)}</div>
                  <Button variant="outline" className="rounded-xl px-3" onClick={() => setDisplayMonth(getMonthStart(addMonths(displayMonth, 1)))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-ink/55">红色为正收益，蓝色为负收益，灰色为休市，白色为未记录。</div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs text-ink/45">
                {["日", "一", "二", "三", "四", "五", "六"].map((label) => (
                  <div key={label} className="py-1">{label}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthGrid.map((date) => {
                  const inMonth = date.slice(0, 7) === displayMonth.slice(0, 7);
                  const entry = activeEntryMap.get(date);
                  const open = getTradingFlagWithFallback(calendarMap, date, calendarLoading);
                  const selected = date === selectedDate;

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[96px] rounded-[22px] border p-3 text-left transition ${getMonthCellTone(entry?.returnRate ?? null, open, selected)} ${inMonth ? "" : "opacity-55"}`}
                    >
                      <div className="text-sm font-medium">{date.slice(-2)}</div>
                      <div className="mt-3 text-xs leading-5">{open === null ? "待加载" : open ? (entry ? formatSignedPercent(entry.returnRate) : "未记录") : "休市"}</div>
                      {entry?.profitAmount != null ? <div className="mt-1 text-[11px] leading-4">{formatSignedMoney(entry.profitAmount)}</div> : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-ink/10 bg-canvas/50 px-4 py-3 text-sm">
                <div>
                  <div className="text-xs text-ink/50">月度收益率</div>
                  <div className="mt-1 font-semibold text-ink">{displayedMonthSummary ? formatSignedPercent(displayedMonthSummary.returnRate) : "--"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink/50">月度收益金额</div>
                  <div className="mt-1 font-semibold text-ink">{displayedMonthSummary ? formatSignedMoney(displayedMonthSummary.profitAmount) : "--"}</div>
                </div>
              </div>
            </FieldCard>

            <FieldCard title="当日复盘详情" description="先看当天摘要，再决定切热力图还是单票轨迹。">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-ink/55">当前选中日期</div>
                  <div className="mt-1 text-2xl font-semibold text-ink">{selectedDate}</div>
                  <div className="mt-1 text-xs text-ink/55">{selectedOutsideTask ? "当前日期超出任务范围" : selectedOpen === false ? "休市日" : selectedOpen === null ? "交易日历加载中" : selectedEntry ? "已有收益记录" : "交易日但还未记录"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={detailView === "summary" ? "default" : "outline"} className="rounded-xl" onClick={() => setDetailView("summary")}>摘要</Button>
                  <Button variant={detailView === "heatmap" ? "default" : "outline"} className="rounded-xl" onClick={() => setDetailView("heatmap")}>热力图</Button>
                  <Button variant={detailView === "timeline" ? "default" : "outline"} className="rounded-xl" onClick={() => setDetailView("timeline")}>单票轨迹</Button>
                </div>
              </div>

              {detailView === "summary" ? (
                <div className="grid gap-4 2xl:grid-cols-[0.98fr,1.02fr]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StockMetricCard label="当日收益率" value={selectedEntry ? formatSignedPercent(selectedEntry.returnRate) : "--"} detail={selectedEntry ? "来自已保存的日收益记录" : "当天还没有保存记录"} />
                    <StockMetricCard label="当日收益金额" value={formatSignedMoney(selectedEntry?.profitAmount ?? null)} detail={selectedEntry?.assetValue != null ? `总资产 ${formatMoney(selectedEntry.assetValue)}` : "未填写总资产"} />
                    <StockMetricCard label="基准表现" value={selectedEntry?.benchmarkName ? `${selectedEntry.benchmarkName} ${formatSignedPercent(selectedEntry.benchmarkReturnRate)}` : "--"} detail="来自截图识别或手动输入" />
                    <StockMetricCard label="记录来源" value={selectedEntry?.source === "photo_parse" ? "截图识别" : selectedEntry ? "手动录入" : "--"} detail={selectedEntry?.sourceLabel ?? "暂无来源说明"} />
                  </div>

                  <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-5">
                    <div className="font-medium text-ink">当日备注与证据</div>
                    <div className="mt-3 text-sm leading-6 text-ink/70">{selectedEntry?.note || "这一天还没有留下复盘备注。可以用日收益录入弹窗补录。"}</div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {selectedEntry?.screenshotUrl ? (
                        <a className="text-sm text-pine underline underline-offset-2" href={selectedEntry.screenshotUrl} target="_blank" rel="noreferrer">查看截图证据</a>
                      ) : (
                        <span className="text-sm text-ink/50">暂无截图证据</span>
                      )}
                      {!selectedEntry && selectedOpen !== false ? (
                        <Button variant="outline" className="rounded-xl" onClick={() => openEntryModal("manual")}>
                          <Plus className="mr-2 h-4 w-4" />
                          为这一天补录
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {detailView === "heatmap" ? (
                selectedContributionHeatmap.length ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-3" style={{ gridAutoRows: "58px", gridAutoFlow: "dense" }}>
                      {selectedContributionHeatmap.map((contribution) => (
                        <button
                          key={contribution.key}
                          type="button"
                          onClick={() => {
                            setSelectedContributionKey(contribution.key);
                            setDetailView("timeline");
                          }}
                          className={`rounded-[22px] border p-3 text-left shadow-sm transition ${getContributionTone(contribution.profitAmount, selectedContributionKey === contribution.key)}`}
                          style={{ gridColumn: `span ${contribution.colSpan}`, gridRow: `span ${contribution.rowSpan}` }}
                        >
                          <div className="flex h-full flex-col justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold leading-5">{contribution.name}</div>
                              <div className="mt-1 text-[11px] opacity-80">{contribution.symbol ?? "未识别代码"}</div>
                            </div>
                            <div className="text-[12px] opacity-90">{formatSignedMoney(contribution.profitAmount)} / {formatSignedPercent(contribution.contributionRate)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="text-xs text-ink/55">点某个热力块，会直接切到这只票的历史贡献轨迹。</div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-5 text-sm text-ink/55">这一天还没有个股贡献数据。你可以通过截图识别，或手动录入仓位和个股收益率来补齐。</div>
                )
              ) : null}

              {detailView === "timeline" ? (
                selectedContributionHistory.length ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <StockMetricCard label="追踪个股" value={selectedContributionSummary?.name ?? "--"} detail={selectedContributionSummary?.symbol ?? "无代码"} />
                      <StockMetricCard label="累计贡献金额" value={formatSignedMoney(selectedContributionChart.at(-1)?.cumulative ?? null)} detail="当前任务周期内累计" />
                      <StockMetricCard label="出现次数" value={String(selectedContributionHistory.length)} detail="当前任务内有记录的交易日" />
                    </div>

                    <div className="h-72 rounded-[24px] border border-ink/10 bg-white/75 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedContributionChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e9e7df" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#7b766b" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#7b766b" />
                          <Tooltip />
                          <Line type="monotone" dataKey="cumulative" stroke="#2d6b52" strokeWidth={2.5} dot={{ r: 2 }} name="累计贡献金额" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {[...selectedContributionHistory].reverse().map((item) => (
                        <button
                          key={`${item.date}-${item.symbol ?? item.name}`}
                          type="button"
                          onClick={() => setSelectedDate(item.date)}
                          className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-ink/10 bg-white/75 p-4 text-left transition hover:border-pine/25"
                        >
                          <div>
                            <div className="font-medium text-ink">{item.date}</div>
                            <div className="mt-1 text-xs text-ink/55">当日组合收益率 {formatSignedPercent(item.portfolioReturnRate)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-ink">{formatSignedMoney(item.profitAmount)}</div>
                            <div className="mt-1 text-xs text-ink/55">{formatSignedPercent(item.contributionRate)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-5 text-sm text-ink/55">先从热力图或功臣榜里选一只票，或者先积累一些个股贡献数据。</div>
                )
              ) : null}
            </FieldCard>

            <div className="grid gap-4 2xl:grid-cols-[0.92fr,1.08fr]">
              <FieldCard title="归档与归因" description="把功臣榜、拖后腿榜和日记录列表放在同一大块里。你只要切视角，不用跳来跳去。">
                <div className="flex gap-2">
                  <Button variant={archiveView === "leaders" ? "default" : "outline"} className="rounded-xl" onClick={() => setArchiveView("leaders")}>
                    <Trophy className="mr-2 h-4 w-4" />
                    功臣榜
                  </Button>
                  <Button variant={archiveView === "records" ? "default" : "outline"} className="rounded-xl" onClick={() => setArchiveView("records")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    日记录
                  </Button>
                </div>

                {archiveView === "leaders" ? (
                  <div className="space-y-3">
                    <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4 text-sm text-ink/65">上面是累计贡献最大的功臣，下面则是拖后腿最明显的股票。点任意一项，右侧会自动切到它的历史贡献轨迹。</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-ink">功臣榜</div>
                        {contributionLeaders.length ? contributionLeaders.map((item, index) => (
                          <button
                            key={`leader-${item.key}`}
                            type="button"
                            onClick={() => {
                              setSelectedContributionKey(item.key);
                              setDetailView("timeline");
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-[22px] border p-4 text-left transition ${selectedContributionKey === item.key ? "border-pine bg-pine/5" : "border-ink/10 bg-white/75 hover:border-pine/25"}`}
                          >
                            <div>
                              <div className="text-xs text-ink/45">#{index + 1}</div>
                              <div className="mt-1 font-medium text-ink">{item.name}</div>
                              <div className="mt-1 text-xs text-ink/55">{item.symbol ?? "无代码"}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-ink">{formatSignedMoney(item.profitAmount)}</div>
                              <div className="mt-1 text-xs text-ink/55">{formatSignedPercent(item.contributionRate)}</div>
                            </div>
                          </button>
                        )) : <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-4 text-sm text-ink/55">还没有累计贡献数据。</div>}
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-ink">拖后腿榜</div>
                        {contributionLaggards.length ? contributionLaggards.map((item, index) => (
                          <button
                            key={`laggard-${item.key}`}
                            type="button"
                            onClick={() => {
                              setSelectedContributionKey(item.key);
                              setDetailView("timeline");
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-[22px] border p-4 text-left transition ${selectedContributionKey === item.key ? "border-pine bg-pine/5" : "border-ink/10 bg-white/75 hover:border-pine/25"}`}
                          >
                            <div>
                              <div className="text-xs text-ink/45">#{index + 1}</div>
                              <div className="mt-1 font-medium text-ink">{item.name}</div>
                              <div className="mt-1 text-xs text-ink/55">{item.symbol ?? "无代码"}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-ink">{formatSignedMoney(item.profitAmount)}</div>
                              <div className="mt-1 text-xs text-ink/55">{formatSignedPercent(item.contributionRate)}</div>
                            </div>
                          </button>
                        )) : <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-4 text-sm text-ink/55">还没有累计贡献数据。</div>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeEntries.length ? activeEntries.map((entry) => (
                      <div key={entry.id} className="rounded-[22px] border border-ink/10 bg-white/75 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <button type="button" className="text-left" onClick={() => setSelectedDate(entry.date)}>
                            <div className="font-medium text-ink">{entry.date}</div>
                            <div className="mt-1 text-xs text-ink/55">{entry.source === "photo_parse" ? "截图识别" : "手动录入"} · {entry.contributions?.length ?? 0} 条贡献明细</div>
                          </button>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-medium text-ink">{formatSignedPercent(entry.returnRate)}</div>
                              <div className="mt-1 text-xs text-ink/55">{formatSignedMoney(entry.profitAmount)}</div>
                            </div>
                            <Button variant="ghost" className="rounded-xl px-3 text-ink/60 hover:text-ink" onClick={() => removeStockReturnEntry(entry.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )) : <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-5 text-sm text-ink/55">当前任务还没有日收益记录。</div>}
                  </div>
                )}
              </FieldCard>

              <FieldCard title="当前追踪股票" description="这里专门留给单票轨迹，不再和日复盘、任务数据挤在一起。">
                {selectedContributionHistory.length ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <StockMetricCard label="股票" value={selectedContributionSummary?.name ?? "--"} detail={selectedContributionSummary?.symbol ?? "无代码"} />
                      <StockMetricCard label="累计贡献" value={formatSignedMoney(selectedContributionChart.at(-1)?.cumulative ?? null)} detail="任务周期内累计" />
                      <StockMetricCard label="最近一次贡献" value={selectedContributionSummary ? formatSignedMoney(selectedContributionSummary.profitAmount) : "--"} detail={selectedContributionSummary?.date ?? "暂无"} />
                    </div>

                    <div className="h-72 rounded-[24px] border border-ink/10 bg-white/75 p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedContributionChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e9e7df" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#7b766b" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#7b766b" />
                          <Tooltip />
                          <Line type="monotone" dataKey="cumulative" stroke="#2d6b52" strokeWidth={2.5} dot={{ r: 2 }} name="累计贡献金额" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-ink/15 bg-canvas/40 p-5 text-sm text-ink/55">先从当日热力图、功臣榜或拖后腿榜里选一只票。</div>
                )}
              </FieldCard>
            </div>
          </>
        ) : null}
      </div>

      <ModalSurface
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          resetTaskDraft();
        }}
        title="新建股票任务"
        description="任务是一个不重叠的阶段区间。你只需要填标题、起始日期、时长单位、起始资金和目标资金，系统会自动算出结束日期。"
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-ink/55">任务标题</label>
              <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="例如 2026 Q2 资金突破" />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">开始日期</label>
              <Input type="date" value={taskStartDate} onChange={(event) => setTaskStartDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">周期数字</label>
              <Input type="number" min="1" value={taskDurationValue} onChange={(event) => setTaskDurationValue(event.target.value)} placeholder="只输数字即可" />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">周期单位</label>
              <Select value={taskDurationUnit} onChange={(event) => setTaskDurationUnit(event.target.value as StockDurationUnit)}>
                {durationUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">起始资金</label>
              <Input type="number" min="0" value={taskStartAmount} onChange={(event) => setTaskStartAmount(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">目标资金</label>
              <Input type="number" min="0" value={taskTargetAmount} onChange={(event) => setTaskTargetAmount(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">预计结束日期</div>
              <div className="mt-1 text-lg font-semibold text-ink">{proposedEndDate ?? "--"}</div>
            </div>
            <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">时间校验</div>
              <div className={`mt-1 text-sm font-medium ${overlapTask ? "text-amber-700" : "text-pine"}`}>{overlapTask ? `与任务「${overlapTask.title}」重叠` : "当前区间可创建"}</div>
            </div>
            <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
              <div className="text-xs text-ink/50">创建原则</div>
              <div className="mt-1 text-sm font-medium text-ink">任务开始后起始资金锁定</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button className="rounded-2xl" disabled={!canCreateTask} onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              创建任务
            </Button>
            <div className="text-xs text-ink/55">任务之间可以衔接，但不允许时间区间重叠。</div>
          </div>
        </div>
      </ModalSurface>

      <ModalSurface
        open={entryModalOpen}
        onClose={() => {
          setEntryModalOpen(false);
          resetEntryDraft();
        }}
        title="录入每日收益"
        description="收益录入、截图识别和个股贡献都集中在这里。页面外层不再堆表单，主页面只看结果。"
      >
        <div className="space-y-5">
          <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-medium text-ink">
                  <ScanSearch className="h-4 w-4" />
                  截图识别预填
                </div>
                <div className="mt-1 text-sm leading-6 text-ink/65">上传同花顺或券商截图，自动预填日期、收益率、收益金额、总资产和个股贡献。识别后仍由你确认再写入。</div>
              </div>
              <div className="flex items-center gap-2">
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoParse} />
                <Button type="button" variant="outline" className="rounded-2xl" disabled={photoParsing} onClick={() => photoInputRef.current?.click()}>
                  {photoParsing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  {photoParsing ? "识别中..." : "上传截图识别"}
                </Button>
              </div>
            </div>

            {photoParseError ? <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{photoParseError}</div> : null}

            {photoParseResult ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <StockMetricCard label="识别日期" value={photoParseResult.screenshotDate ?? "--"} detail="来自截图" />
                  <StockMetricCard label="识别收益率" value={formatSignedPercent(photoParseResult.dailyReturnRate)} detail="识别结果" />
                  <StockMetricCard label="识别收益金额" value={formatSignedMoney(photoParseResult.dailyProfitAmount)} detail="识别结果" />
                  <StockMetricCard label="识别总资产" value={photoParseResult.totalAsset != null ? formatMoney(photoParseResult.totalAsset) : "--"} detail="识别结果" />
                  <StockMetricCard label="识别置信度" value={photoParseResult.confidence != null ? `${photoParseResult.confidence}%` : "--"} detail="模型返回" />
                </div>

                <div className="rounded-2xl border border-ink/10 bg-white/75 p-4 text-sm text-ink/70">
                  <div className="font-medium text-ink">识别摘要</div>
                  <div className="mt-1">{photoParseResult.summary}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/55">
                    <span>来源：{photoParseResult.sourceLabel ?? "截图识别"}</span>
                    {photoParseResult.benchmarkName ? <span>基准：{photoParseResult.benchmarkName} {formatSignedPercent(photoParseResult.benchmarkReturnRate)}</span> : null}
                    {photoParseResult.screenshotUrl ? <a className="text-pine underline underline-offset-2" href={photoParseResult.screenshotUrl} target="_blank" rel="noreferrer">查看上传原图</a> : <span>当前未写入截图存储</span>}
                  </div>
                </div>

                {previewContributionHeatmap.length ? (
                  <div className="rounded-2xl border border-ink/10 bg-canvas/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="font-medium text-ink">截图识别贡献热力预览</div>
                      <div className="text-xs text-ink/55">{photoParseResult.contributions.length} 项</div>
                    </div>
                    <div className="grid grid-cols-12 gap-3" style={{ gridAutoRows: "52px", gridAutoFlow: "dense" }}>
                      {previewContributionHeatmap.map((contribution) => (
                        <button
                          key={`preview-${contribution.key}`}
                          type="button"
                          onClick={() => setSelectedContributionKey(contribution.key)}
                          className={`rounded-[20px] border p-3 text-left shadow-sm transition ${getContributionTone(contribution.profitAmount, selectedContributionKey === contribution.key)}`}
                          style={{ gridColumn: `span ${contribution.colSpan}`, gridRow: `span ${contribution.rowSpan}` }}
                        >
                          <div className="flex h-full flex-col justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold leading-5">{contribution.name}</div>
                              <div className="mt-1 text-[11px] opacity-80">{contribution.symbol ?? "未识别代码"}</div>
                            </div>
                            <div className="text-[12px] opacity-90">{formatSignedMoney(contribution.profitAmount)} / {formatSignedPercent(contribution.contributionRate)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-ink/55">记录日期</label>
              <Input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">当日收益率（%）</label>
              <Input type="number" step="0.01" value={entryReturnRate} onChange={(event) => setEntryReturnRate(event.target.value)} placeholder="例如 1.25 或 -0.80" />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">当日收益金额（元，可选）</label>
              <Input type="number" step="0.01" value={entryProfitAmount} onChange={(event) => setEntryProfitAmount(event.target.value)} placeholder="例如 2580.35" />
            </div>
            <div>
              <label className="mb-2 block text-xs text-ink/55">当日总资产（元，可选）</label>
              <Input type="number" step="0.01" value={entryAssetValue} onChange={(event) => setEntryAssetValue(event.target.value)} placeholder="例如 135800.22" />
            </div>
          </div>

          <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-ink">手动录入个股贡献</div>
                <div className="mt-1 text-xs text-ink/55">输入仓位占比和个股收益率，系统自动计算当日组合贡献率和贡献金额。</div>
              </div>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setManualContributionDrafts((prev) => [...prev, createManualContributionDraft(String(Date.now() + prev.length))])}>
                <Plus className="mr-2 h-4 w-4" />
                新增股票
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {manualContributionDrafts.map((draft) => {
                const preview = manualContributionPreview.rows.find((row) => row.id === draft.id);
                return (
                  <div key={draft.id} className="rounded-[22px] border border-ink/10 bg-white/75 p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                      <div>
                        <label className="mb-2 block text-xs text-ink/55">股票名</label>
                        <Input value={draft.name} onChange={(event) => setManualContributionDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, name: event.target.value } : item)))} placeholder="例如 宏景科技" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-ink/55">代码</label>
                        <Input value={draft.symbol} onChange={(event) => setManualContributionDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, symbol: event.target.value } : item)))} placeholder="可选" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-ink/55">仓位占比（%）</label>
                        <Input type="number" step="0.01" value={draft.weightPercent} onChange={(event) => setManualContributionDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, weightPercent: event.target.value } : item)))} placeholder="例如 12.5" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-ink/55">个股收益率（%）</label>
                        <Input type="number" step="0.01" value={draft.stockReturnRate} onChange={(event) => setManualContributionDrafts((prev) => prev.map((item) => (item.id === draft.id ? { ...item, stockReturnRate: event.target.value } : item)))} placeholder="例如 6.2" />
                      </div>
                      <div className="rounded-2xl border border-ink/10 bg-canvas/50 px-3 py-3">
                        <div className="text-xs text-ink/50">组合贡献</div>
                        <div className="mt-1 text-sm font-semibold text-ink">{preview ? formatSignedPercent(preview.contributionRate) : "--"}</div>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 rounded-2xl border border-ink/10 bg-canvas/50 px-3 py-3">
                          <div className="text-xs text-ink/50">贡献金额</div>
                          <div className="mt-1 text-sm font-semibold text-ink">{preview ? formatSignedMoney(preview.profitAmount) : "--"}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 rounded-xl px-3 text-ink/60 hover:text-ink"
                          onClick={() => setManualContributionDrafts((prev) => prev.length > 1 ? prev.filter((item) => item.id !== draft.id) : [createManualContributionDraft(String(Date.now()))])}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-ink/10 bg-white/75 p-4">
                <div className="text-xs text-ink/50">已录仓位合计</div>
                <div className="mt-1 text-lg font-semibold text-ink">{formatPercent(manualContributionPreview.totalWeightPercent)}</div>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-white/75 p-4">
                <div className="text-xs text-ink/50">自动计算日收益率</div>
                <div className="mt-1 text-lg font-semibold text-ink">{manualContributionPreview.rows.length ? formatSignedPercent(manualContributionPreview.totalContributionRate) : "--"}</div>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-white/75 p-4">
                <div className="text-xs text-ink/50">自动计算收益金额</div>
                <div className="mt-1 text-lg font-semibold text-ink">{manualContributionPreview.totalProfitAmount != null ? formatSignedMoney(manualContributionPreview.totalProfitAmount) : "--"}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-ink/55">备注</label>
            <Textarea value={entryNote} onChange={(event) => setEntryNote(event.target.value)} placeholder="记录当天操作、仓位变化、规则执行情况，或截图里没有表达出来的信息。" className="min-h-[120px]" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button className="rounded-2xl" disabled={!canSaveEntry} onClick={handleSaveEntry}>
              <Wallet className="mr-2 h-4 w-4" />
              写入收益记录
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={resetEntryDraft}>清空草稿</Button>
            <div className="text-xs text-ink/55">{entryWriteHint}</div>
          </div>
        </div>
      </ModalSurface>

      <ModalSurface
        open={reviewMode != null}
        onClose={() => setReviewMode(null)}
        title={reviewMode === "weekly" ? "周度复盘" : "月度复盘"}
        description={reviewMode === "weekly" ? "只写本周真正有价值的偏差、做对的事和下周必须执行的规则。" : "只写这个月真正沉淀下来的判断、系统升级和需要退场的旧规则。"}
        maxWidthClass="max-w-3xl"
      >
        {activeTask ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
                <div className="text-xs text-ink/50">{reviewMode === "weekly" ? "本周应达" : "本月应达"}</div>
                <div className="mt-1 text-2xl font-semibold text-ink">{taskStats ? formatMoney(reviewMode === "weekly" ? taskStats.weekTarget : taskStats.monthTarget) : "--"}</div>
              </div>
              <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4">
                <div className="text-xs text-ink/50">当前净值</div>
                <div className="mt-1 text-2xl font-semibold text-ink">{taskStats ? formatMoney(taskStats.latestAmount) : "--"}</div>
              </div>
            </div>

            <Textarea
              className="min-h-[240px]"
              value={reviewMode === "weekly" ? activeTask.weeklyReview : activeTask.monthlyReview}
              onChange={(event) => setStockTaskReview(activeTask.id, reviewMode === "weekly" ? "weeklyReview" : "monthlyReview", event.target.value)}
              placeholder={reviewMode === "weekly" ? "写本周做对了什么、最大偏差是什么、下周要压住什么错误。" : "写这个月的节奏、规则升级、该保留什么、该退场什么。"}
            />
          </div>
        ) : null}
      </ModalSurface>
    </AppShell>
  );
}

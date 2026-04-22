import { NextRequest, NextResponse } from "next/server";

const { holiday } = require("@kang8/chinese-holidays");

const MAX_RANGE_DAYS = 4000;
const SOURCE_LABEL = "本地 A 股交易日历（按中国法定节假日规则生成）";

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid date: ${value}`);
  }

  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function parseLocalDateForHoliday(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid date: ${value}`);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = parseDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatDate(next);
}

function isWeekend(date: string) {
  const day = parseDate(date).getUTCDay();
  return day === 0 || day === 6;
}

function enumerateDates(start: string, end: string) {
  const dates: string[] = [];
  let cursor = start;

  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function isPublicHoliday(date: string) {
  return Boolean(holiday.isHoliday(parseLocalDateForHoliday(date)));
}

function buildTradingCalendar(start: string, end: string) {
  return enumerateDates(start, end).map((date) => ({
    date,
    open: !isWeekend(date) && !isPublicHoliday(date),
  }));
}

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!start || !end) {
    return new NextResponse("Missing start or end", { status: 400 });
  }

  try {
    const startDate = parseDate(start);
    const endDate = parseDate(end);

    if (startDate > endDate) {
      return new NextResponse("start must be before end", { status: 400 });
    }

    const spanDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

    if (spanDays > MAX_RANGE_DAYS) {
      return new NextResponse(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, { status: 400 });
    }

    return NextResponse.json({
      start,
      end,
      source: SOURCE_LABEL,
      days: buildTradingCalendar(start, end),
    });
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Failed to build A-share calendar", {
      status: 502,
    });
  }
}

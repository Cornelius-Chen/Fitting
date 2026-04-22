"use client";

import { BootstrapPayload, DailyReport, Profile, StockPhotoParseResult, UserPlanState } from "@/types/plan";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface AShareCalendarDay {
  date: string;
  open: boolean;
}

export interface AShareCalendarResponse {
  start: string;
  end: string;
  source: string;
  days: AShareCalendarDay[];
}

async function getAuthHeaders() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return {} as Record<string, string>;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  } as Record<string, string>;
}

export async function fetchBootstrap() {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/bootstrap", { headers, cache: "no-store" });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as BootstrapPayload;
}

export async function updateProfile(payload: Profile) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function updatePlanState(payload: UserPlanState) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/plan-state", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function upsertDailyReport(payload: DailyReport) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/daily-reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as DailyReport;
}

export async function fetchAShareCalendar(start: string, end: string) {
  const params = new URLSearchParams({ start, end });
  const response = await fetch(`/api/a-share-calendar?${params.toString()}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as AShareCalendarResponse;
}

export async function parseStockScreenshot(payload: {
  file: File;
  taskTitle: string;
  taskStartDate: string;
  taskEndDate: string;
}) {
  const headers = await getAuthHeaders();
  const body = new FormData();
  body.set("image", payload.file);
  body.set("taskTitle", payload.taskTitle);
  body.set("taskStartDate", payload.taskStartDate);
  body.set("taskEndDate", payload.taskEndDate);

  const response = await fetch("/api/stock-photo-parse", {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as StockPhotoParseResult;
}

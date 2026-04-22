import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server-auth";
import { StockContribution, StockPhotoParseResult } from "@/types/plan";

export const runtime = "nodejs";

type RawContribution = {
  name: string;
  symbol: string | null;
  profitAmount: number | null;
  contributionRate: number | null;
};

type RawParseResult = {
  screenshotDate: string | null;
  dailyReturnRate: number | null;
  dailyProfitAmount: number | null;
  totalAsset: number | null;
  benchmarkName: string | null;
  benchmarkReturnRate: number | null;
  contributions: RawContribution[];
  confidence: number | null;
  summary: string;
  sourceLabel: string | null;
};

function toDataUrl(bytes: ArrayBuffer, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeContributions(
  items: RawContribution[] | null | undefined,
  dailyProfitAmount: number | null,
) {
  const normalized = (items ?? [])
    .map((item) => {
      const name = item.name?.trim();

      if (!name) {
        return null;
      }

      const profitAmount = typeof item.profitAmount === "number" && Number.isFinite(item.profitAmount) ? roundTo(item.profitAmount) : null;
      let contributionRate =
        typeof item.contributionRate === "number" && Number.isFinite(item.contributionRate) ? roundTo(item.contributionRate) : null;

      if (contributionRate == null && dailyProfitAmount && profitAmount != null && dailyProfitAmount !== 0) {
        contributionRate = roundTo((profitAmount / dailyProfitAmount) * 100);
      }

      const contribution: StockContribution = {
        name,
        symbol: item.symbol?.trim() || null,
        profitAmount,
        contributionRate,
      };

      return contribution;
    })
    .filter((item): item is StockContribution => Boolean(item));

  return normalized.sort((a, b) => (b.profitAmount ?? Number.NEGATIVE_INFINITY) - (a.profitAmount ?? Number.NEGATIVE_INFINITY));
}

function normalizeParseResult(result: RawParseResult): StockPhotoParseResult {
  const dailyProfitAmount =
    typeof result.dailyProfitAmount === "number" && Number.isFinite(result.dailyProfitAmount) ? roundTo(result.dailyProfitAmount) : null;

  return {
    screenshotDate: result.screenshotDate || null,
    dailyReturnRate:
      typeof result.dailyReturnRate === "number" && Number.isFinite(result.dailyReturnRate) ? roundTo(result.dailyReturnRate) : null,
    dailyProfitAmount,
    totalAsset: typeof result.totalAsset === "number" && Number.isFinite(result.totalAsset) ? roundTo(result.totalAsset) : null,
    benchmarkName: result.benchmarkName?.trim() || null,
    benchmarkReturnRate:
      typeof result.benchmarkReturnRate === "number" && Number.isFinite(result.benchmarkReturnRate)
        ? roundTo(result.benchmarkReturnRate)
        : null,
    contributions: normalizeContributions(result.contributions, dailyProfitAmount),
    confidence: typeof result.confidence === "number" && Number.isFinite(result.confidence) ? roundTo(result.confidence) : null,
    summary: result.summary?.trim() || "已从截图中提取可见信息。",
    sourceLabel: result.sourceLabel?.trim() || null,
  };
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const parts = payload?.output?.flatMap((item: any) => item?.content ?? []) ?? [];
  const outputText = parts
    .filter((part: any) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part: any) => part.text)
    .join("");

  return outputText.trim();
}

export async function POST(request: NextRequest) {
  const inferenceUrl = process.env.STOCK_VISION_API_URL || "https://api.openai.com/v1/responses";
  const apiKey = process.env.STOCK_VISION_API_KEY || process.env.OPENAI_API_KEY || "";
  const model = process.env.STOCK_VISION_MODEL || "gpt-4o-mini";
  const authHeader = request.headers.get("authorization");

  if (!apiKey && !process.env.STOCK_VISION_API_URL) {
    return new NextResponse("服务端未配置识图模型。可设置 OPENAI_API_KEY，或把 STOCK_VISION_API_URL 指到本地多模态接口。", { status: 503 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return new NextResponse("没有收到截图文件。", { status: 400 });
  }

  if (!image.type.startsWith("image/")) {
    return new NextResponse("上传的文件不是图片。", { status: 400 });
  }

  if (image.size > 8 * 1024 * 1024) {
    return new NextResponse("截图过大，请控制在 8MB 以内。", { status: 400 });
  }

  const taskTitle = String(formData.get("taskTitle") ?? "").trim();
  const taskStartDate = String(formData.get("taskStartDate") ?? "").trim();
  const taskEndDate = String(formData.get("taskEndDate") ?? "").trim();
  const imageBytes = await image.arrayBuffer();
  const imageDataUrl = toDataUrl(imageBytes, image.type || "image/jpeg");
  let screenshotPath: string | null = null;
  let screenshotUrl: string | null = null;

  if (authHeader?.trim()) {
    const auth = await requireApiUser(request);

    if (!("error" in auth)) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STOCK_SCREENSHOT_BUCKET || "stock-screenshots";
      const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const taskSlug = sanitizePathSegment(taskTitle || "stock-task");
      const filePath = `${auth.user.id}/${taskSlug}/${Date.now()}.${extension}`;
      const upload = await auth.client.storage.from(bucket).upload(filePath, Buffer.from(imageBytes), {
        contentType: image.type || "image/jpeg",
        upsert: false,
      });

      if (!upload.error) {
        screenshotPath = filePath;
        const publicUrl = auth.client.storage.from(bucket).getPublicUrl(filePath);
        screenshotUrl = publicUrl.data.publicUrl || null;
      }
    }
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "screenshotDate",
      "dailyReturnRate",
      "dailyProfitAmount",
      "totalAsset",
      "benchmarkName",
      "benchmarkReturnRate",
      "contributions",
      "confidence",
      "summary",
      "sourceLabel",
    ],
    properties: {
      screenshotDate: { anyOf: [{ type: "string" }, { type: "null" }] },
      dailyReturnRate: { anyOf: [{ type: "number" }, { type: "null" }] },
      dailyProfitAmount: { anyOf: [{ type: "number" }, { type: "null" }] },
      totalAsset: { anyOf: [{ type: "number" }, { type: "null" }] },
      benchmarkName: { anyOf: [{ type: "string" }, { type: "null" }] },
      benchmarkReturnRate: { anyOf: [{ type: "number" }, { type: "null" }] },
      confidence: { anyOf: [{ type: "number" }, { type: "null" }] },
      summary: { type: "string" },
      sourceLabel: { anyOf: [{ type: "string" }, { type: "null" }] },
      contributions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "symbol", "profitAmount", "contributionRate"],
          properties: {
            name: { type: "string" },
            symbol: { anyOf: [{ type: "string" }, { type: "null" }] },
            profitAmount: { anyOf: [{ type: "number" }, { type: "null" }] },
            contributionRate: { anyOf: [{ type: "number" }, { type: "null" }] },
          },
        },
      },
    },
  };

  const instructions = [
    "你在解析中国股票软件截图，输出必须是 JSON，并严格符合给定 schema。",
    "优先提取：截图日期、当日收益率、当日收益金额、总资产、基准名称与涨跌幅、个股贡献列表。",
    "如果字段在图中不可见或不确定，返回 null，不要猜。",
    "日期必须输出 YYYY-MM-DD。",
    "个股贡献中的 profitAmount 单位为人民币元，contributionRate 单位为百分比。",
    "如果个股贡献里只看得到金额，看不到贡献占比，可以先填 null。",
    "优先使用截图里被选中的日期；若只有“今”且无明确年月日，再结合图中年月栏与当前界面关系判断；仍不确定就返回 null。",
    `当前任务是「${taskTitle || "未命名任务"}」，任务区间 ${taskStartDate || "未知"} 到 ${taskEndDate || "未知"}。`,
  ].join("\n");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(inferenceUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "请解析这张股票收益截图，返回结构化结果。只提取图中清晰可见的信息。",
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "stock_screenshot_parse",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    return new NextResponse(await response.text(), { status: 502 });
  }

  const payload = await response.json();

  if (payload?.status === "incomplete") {
    return new NextResponse("截图识别未完成，请换一张更清晰的截图再试。", { status: 502 });
  }

  const outputText = extractOutputText(payload);

  if (!outputText) {
    return new NextResponse("截图识别没有返回可解析结果。", { status: 502 });
  }

  const normalized = normalizeParseResult(JSON.parse(outputText) as RawParseResult);
  normalized.screenshotPath = screenshotPath;
  normalized.screenshotUrl = screenshotUrl;
  return NextResponse.json(normalized);
}

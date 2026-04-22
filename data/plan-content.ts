import {
  DialogueRole,
  DailyFocusDraft,
  DailyReport,
  LearningLog,
  LearningTrack,
  PhaseKey,
  PhaseMeta,
  Profile,
  ReminderKey,
  ReminderTemplate,
  ResourceLink,
  StockTask,
  SystemBlueprint,
  SystemKey,
  UserPlanState,
  WeeklyReview,
  WeeklyRoadmapItem,
} from "@/types/plan";

export const storageKeys = {
  app: "cornelius-operating-system-v1",
};

export const phaseMeta: Record<PhaseKey, PhaseMeta> = {
  1: {
    title: "第 1 阶段：压噪音，立骨架",
    weeks: "第 1-4 周",
    focus: "先把睡眠、起床锚点、三段提醒和主项目节奏稳住。",
    target: "从高波动切到可控推进，先结束混乱。",
  },
  2: {
    title: "第 2 阶段：建规则，提推进",
    weeks: "第 5-8 周",
    focus: "开始强化边界、社交推进、外表复现和项目回写规则。",
    target: "从偶尔强，变成大多数日子都能稳定输出。",
  },
  3: {
    title: "第 3 阶段：整合输出，形成复利",
    weeks: "第 9-12 周",
    focus: "把行为、社交、学习、项目协同接成一个长期操作系统。",
    target: "把执行和判断沉淀成可重复调用的资产。",
  },
};

export const weeklyRoadmap: WeeklyRoadmapItem[] = Array.from({ length: 12 }, (_, index) => {
  const week = index + 1;
  const phase = week <= 4 ? 1 : week <= 8 ? 2 : 3;

  const themes: Record<PhaseKey, string[]> = {
    1: ["稳起床和睡眠", "固定主任务块", "把三段提醒跑顺", "观察失控触发点"],
    2: ["练到点切换", "练轻推进", "把外表状态稳定复现", "开始方法论回写"],
    3: ["项目闭环升级", "对话角色化", "规则库沉淀", "半自动化准备"],
  };

  const outcomes: Record<PhaseKey, string[]> = {
    1: ["乱度下降", "白天主任务变实", "夜晚失控窗口缩小", "形成基础控制感"],
    2: ["推进更自然", "边界更清楚", "形象更整洁", "规则开始稳定生效"],
    3: ["项目节奏更硬", "学习更靠主线", "方法资产变厚", "个人系统开始复利"],
  };

  const cautions: Record<PhaseKey, string[]> = {
    1: ["不要一口气加太多规则", "不要因为一次失手直接全盘否定", "先追稳定，再追强度", "夜晚不要继续开新坑"],
    2: ["别把社交训练做成表演", "别为了好看牺牲恢复", "新规则太多时先砍数量", "不要把记录系统做得过重"],
    3: ["不要急着自动化所有东西", "先保留关键人为判断", "月主线不要贪多", "新模板要经过实战再固化"],
  };

  const themeIndex = (week - 1) % 4;

  return {
    week,
    phase,
    theme: themes[phase][themeIndex],
    outcome: outcomes[phase][themeIndex],
    caution: cautions[phase][themeIndex],
  };
});

export const reminderTemplates: Record<ReminderKey, ReminderTemplate> = {
  wake: {
    key: "wake",
    title: "起床提醒",
    defaultTime: "07:30",
    reason: "不是靠感觉开始一天，而是先把控制感接上。",
    items: [
      { id: "water", label: "喝水", description: "先做最小唤醒动作，不立刻滑进被动状态。" },
      { id: "light", label: "拉开窗帘/见光", description: "给身体一个明确的开机信号。" },
      { id: "no_phone", label: "不直接陷入手机", description: "避免一早把主导权交出去。" },
      { id: "scan", label: "观察浮肿和精神状态", description: "先知道今天是满配还是保底模式。" },
      { id: "care", label: "基础洗漱与护肤", description: "把外表系统最小版本先跑起来。" },
      { id: "posture", label: "1 分钟体态回正", description: "把颈、肩、下巴位置重新摆正。" },
    ],
  },
  leave: {
    key: "leave",
    title: "出门前提醒",
    defaultTime: "09:00",
    reason: "稳定释放状态，而不是靠偶发发挥。",
    items: [
      { id: "hair_top", label: "检查头顶蓬松度", description: "头顶有形，整个人的精气神才会上来。" },
      { id: "hair_side", label: "检查两侧是否贴脸", description: "避免轮廓被压扁。" },
      { id: "skin", label: "检查 T 区、唇部和整洁度", description: "先修最影响观感的细节。" },
      { id: "stance", label: "检查站姿、脖子、下巴位置", description: "避免一出门就回到塌陷姿态。" },
      { id: "fit", label: "检查衣服版型与颜色统一", description: "穿搭先求利落，再谈风格。" },
      { id: "expression", label: "检查表情是否过紧", description: "不要把自己锁在过度控制的脸上。" },
    ],
  },
  sleep: {
    key: "sleep",
    title: "睡前提醒",
    defaultTime: "22:30",
    reason: "夜晚不再做失控窗口，而是第二天的准备区。",
    items: [
      { id: "clean", label: "晚间清洁和护肤", description: "让外表系统完成收尾，而不是草草结束。" },
      { id: "risk", label: "记录今天是否有失控风险", description: "把漂移点标出来，不要第二天才后知后觉。" },
      { id: "shutdown", label: "关闭高刺激任务", description: "不在上床前继续开新战线。" },
      { id: "stretch", label: "轻拉伸或体态回正", description: "把身体从一天的紧绷里拉出来。" },
      { id: "tomorrow", label: "确认明日主任务", description: "第二天的启动成本必须足够低。" },
      { id: "bed", label: "确认上床时间", description: "真正的恢复要靠守时，不靠补救。" },
    ],
  },
};

export const systemBlueprints: Record<SystemKey, SystemBlueprint> = {
  appearance: {
    key: "appearance",
    title: "外表系统",
    summary: "目标不是追求网红版本，而是把基础状态稳定拉满。",
    headline: "基础状态拉满 + 微调关键点",
    items: [
      { id: "grooming", label: "基础清洁与护肤", description: "先把最稳定能复现的部分做扎实。" },
      { id: "hair", label: "头发与轮廓管理", description: "头顶、两侧、鬓角是第一观感核心。" },
      { id: "posture", label: "体态与肩颈展开", description: "站姿不对，再好的脸也会掉价。" },
      { id: "fit", label: "穿搭统一度", description: "减少噪音，优先版型和整洁度。" },
    ],
    reviewPrompts: ["今天最影响观感的一个细节是什么？", "哪一个动作最容易让你看起来显得松散？"],
  },
  behavior: {
    key: "behavior",
    title: "行为系统",
    summary: "从状态驱动切到规则驱动，把控制层搭起来。",
    headline: "起床锚点 + 主任务块 + 到点切换 + 睡眠锚点",
    items: [
      { id: "wake_anchor", label: "起床锚点", description: "误差控制在 30 分钟内，先收回主导权。" },
      { id: "focus_block", label: "主任务块", description: "每天至少一个不可打断的深度块。" },
      { id: "time_box", label: "时间盒与到点切换", description: "深度可以强，但不能无限延长。" },
      { id: "sleep_anchor", label: "睡眠锚点", description: "夜晚不再继续拖到失控。" },
    ],
    reviewPrompts: ["今天哪个环节最容易谈判失败？", "哪条规则要保留，哪条规则该缩减？"],
  },
  social: {
    key: "social",
    title: "社交系统",
    summary: "不是变成话术机器，而是学会自然、松弛、稳定推进。",
    headline: "轻接触 + 轻连接 + 轻推进 + 边界感",
    items: [
      { id: "contact", label: "完成一次轻接触", description: "让互动先自然发生，而不是先想完所有后果。" },
      { id: "connection", label: "完成一次轻连接", description: "一点分享、一点观察、一点好奇。" },
      { id: "advance", label: "完成一次轻推进", description: "给出方向，而不是把关系停在聊得来。" },
      { id: "boundary", label: "守住边界", description: "不急着证明，不急着交出太多内核。" },
    ],
    reviewPrompts: ["今天有没有哪次互动是因为过度收住而错失推进？", "你在哪个时刻把边界守得更成熟了？"],
  },
  inner: {
    key: "inner",
    title: "内在系统",
    summary: "不是继续堆输入，而是建立稳定的内在秩序。",
    headline: "空白时间 + 状态识别 + 价值边界 + 周复盘",
    items: [
      { id: "blank", label: "10 分钟空白", description: "让任务与刺激短暂退出视野。" },
      { id: "state", label: "识别当前状态", description: "知道今天是满配、普通还是保底。" },
      { id: "values", label: "提醒价值边界", description: "清楚什么行为会让自己掉价。" },
      { id: "review", label: "做最小复盘", description: "记录做对了什么，以及哪里又漂了。" },
    ],
    reviewPrompts: ["今天最该退役的一个自我解释是什么？", "你今天最像自己想成为的哪一类人？"],
  },
  learning: {
    key: "learning",
    title: "学习与项目系统",
    summary: "不是收集知识，而是围绕真实项目形成复利闭环。",
    headline: "项目主轴 + 定向输入 + 高质量对谈 + 记录回写",
    items: [
      { id: "project_axis", label: "项目主轴清晰", description: "本周到底在打穿哪个真实系统。" },
      { id: "targeted_input", label: "输入足够定向", description: "只补当前项目最缺的那几块。" },
      { id: "writeback", label: "结论已经回写", description: "规则、模板、动作、问题单至少形成一个。" },
      { id: "dialogue", label: "对谈是高质量的", description: "带着项目、卡点、判断和角色来讨论。" },
    ],
    reviewPrompts: ["这周最大的输入噪音来自哪里？", "哪条新规则已经值得进入长期骨架？"],
  },
};

export const learningTracks: LearningTrack[] = [
  {
    id: "investing",
    title: "主线 A：A 股 / 市场 / 投资判断",
    goal: "形成产业-景气-估值-节奏的结构化判断链。",
    bullets: [
      "不是听故事，而是训练研究到执行的闭环。",
      "重点盯产业、订单、资金、题材与持仓管理。",
      "只让真正能进入决策链的输入留下来。",
    ],
  },
  {
    id: "ai",
    title: "主线 B：AI 部署与企业创业",
    goal: "从 demo 能力，升级到 workflow、治理与商业落地能力。",
    bullets: [
      "不是懂所有概念，而是知道 agent 系统怎么落地。",
      "持续看 workflow、tools、eval、deployment、governance。",
      "训练从好想法到能卖、能部署、能扩张的转换能力。",
    ],
  },
  {
    id: "engineering",
    title: "主线 C：工程与 Codex 协作系统",
    goal: "把每次项目经验沉淀成下一次更强的作业系统。",
    bullets: [
      "强化任务定义、域划分、验证机制与回写规则。",
      "减少模型失忆、误读、偏航和上下文污染。",
      "把协同质量本身做成元能力基础设施。",
    ],
  },
];

export const learningLoop = [
  "项目推进：先做真实项目，用真实问题逼出输入需求。",
  "定向输入：只看和当前主轴直接相关的一手与高质量二手材料。",
  "输出：任何输入都要变成规则、模板、项目动作或问题单。",
  "高质量对谈：带着主项目、卡点、判断和角色来讨论。",
  "记录回写：把结论写回项目宪法、规则库、模板库和决策标准。",
];

export const dialogueRoles: DialogueRole[] = [
  { name: "架构师", description: "帮你看结构是否稳，模块是否分对。" },
  { name: "反方批评者", description: "主动找盲区、找自我循环、找过度乐观。" },
  { name: "复盘官", description: "抓出失控点、退役假设和下一条该升级的规则。" },
  { name: "投资判断挑战者", description: "逼你把逻辑链、证据链和节奏链讲硬。" },
  { name: "项目审计员", description: "检查项目是否偏航、是否缺验证、是否缺回写。" },
];

export const coreResources: ResourceLink[] = [
  {
    title: "OpenAI Agents Guide",
    href: "https://developers.openai.com/api/docs/guides/agents",
    description: "作为 agent workflow 与工具调用的官方入口。",
  },
  {
    title: "Anthropic - Building Effective AI Agents",
    href: "https://www.anthropic.com/research/building-effective-agents",
    description: "看简单可组合模式如何胜过过度复杂框架。",
  },
  {
    title: "fast.ai - Practical Deep Learning for Coders",
    href: "https://course.fast.ai/",
    description: "只取实践部分，服务你的项目落地与部署。",
  },
  {
    title: "a16z - AI Canon",
    href: "https://a16z.com/ai-canon/",
    description: "用于创业与产品判断的骨架阅读入口。",
  },
];

export const defaultProfile: Profile = {
  display_name: "Cornelius",
  role: "高潜力但需要强控制系统的建设者",
  age: 23,
  mission: "把项目、学习、社交与自我控制接成一个长期复利的个人操作系统。",
  sleep_target: 7.5,
  focus_block_minutes: 120,
  weekly_social_target: 3,
};

export function getDefaultDailyFocus(week = 1): DailyFocusDraft {
  const phase = getCurrentPhase(week);

  const byPhase: Record<PhaseKey, DailyFocusDraft> = {
    1: {
      main_project: "先把本周主项目的骨架搭稳",
      main_outcome: "完成一段真正不可打断的深度输出",
      input_focus: "只补当前项目最缺的一块输入",
      output_focus: "至少回写一条规则或一份模板",
      appearance_focus: "先保证头发、整洁度和体态回正",
      behavior_focus: "严格守起床锚点和睡眠锚点",
      social_task: "完成一次轻接触，不追求表现",
      inner_task: "做 10 分钟空白，标记今天的漂移点",
      low_power_floor: "状态差也至少保住主任务 45 分钟 + 睡前提醒",
      note: "今天先求稳定，不求爆发。",
      energy: 7,
    },
    2: {
      main_project: "把现有项目往可复用规则推进",
      main_outcome: "从执行升级到方法论沉淀",
      input_focus: "校准外部案例与官方文档差分",
      output_focus: "回写一条新规则并验证它",
      appearance_focus: "把外表状态做到可重复复现",
      behavior_focus: "练到点切换，不和自己谈判",
      social_task: "完成一次轻推进，给出下一步可能性",
      inner_task: "记录今天哪一次守住了边界",
      low_power_floor: "状态差时也完成一条推进或一条回写",
      note: "今天重点不是更猛，而是更稳、更会推进。",
      energy: 7,
    },
    3: {
      main_project: "把项目、记录和对谈接成闭环",
      main_outcome: "让这周主项目成为方法资产",
      input_focus: "只保留能进入长期骨架的内容",
      output_focus: "规则库、模板库或项目宪法至少升级一处",
      appearance_focus: "稳定呈现，别靠偶发状态",
      behavior_focus: "继续守住深度块与睡眠，不被新想法带走",
      social_task: "完成一次自然连接并守住边界",
      inner_task: "退役一个旧假设，写明下一阶段过滤器",
      low_power_floor: "状态差时也要完成最小闭环，不直接弃日",
      note: "今天做的是整合，不是继续乱扩张。",
      energy: 8,
    },
  };

  return byPhase[phase];
}

export function getDefaultLearningLog(): LearningLog {
  return {
    current_project: "Cornelius × GPT 协同操作系统 V1",
    bottleneck: "先把世界观层、项目层、规则层与记录层接上。",
    current_judgment: "先做手工稳定闭环，再逐步走向半自动化。",
    requested_role: "架构师",
    current_input: "只补和当前主项目直接相关的官方文档与案例。",
    output_type: "规则",
    writeback_target: "项目宪法 / 方法规则库",
  };
}

export function getDefaultWeeklyReview(): WeeklyReview {
  return {
    wins: "本周做对了什么？先写最硬的一件。",
    drifts: "本周最明显的漂移或失控来自哪里？",
    retired_assumptions: "哪个旧判断应该退役？",
    next_rule: "下周只新增一条什么规则？",
    next_focus: "下周唯一主线是什么？",
  };
}

export function getDefaultStockTasks(): StockTask[] {
  return [];
}

export function getDefaultReminderChecks() {
  return Object.fromEntries(
    Object.entries(reminderTemplates).map(([key, template]) => [
      key,
      Object.fromEntries(template.items.map((item) => [item.id, false])),
    ]),
  ) as Record<ReminderKey, Record<string, boolean>>;
}

export function getDefaultReminderTimes() {
  return Object.fromEntries(
    Object.entries(reminderTemplates).map(([key, template]) => [key, template.defaultTime]),
  ) as Record<ReminderKey, string>;
}

export function getDefaultSystemChecks() {
  return Object.fromEntries(
    Object.entries(systemBlueprints).map(([key, blueprint]) => [
      key,
      Object.fromEntries(blueprint.items.map((item) => [item.id, false])),
    ]),
  ) as Record<SystemKey, Record<string, boolean>>;
}

export function getDefaultPlanState(): UserPlanState {
  return {
    current_week: 1,
    reminder_times: getDefaultReminderTimes(),
    reminder_checks: getDefaultReminderChecks(),
    system_checks: getDefaultSystemChecks(),
    daily_focus: getDefaultDailyFocus(1),
    learning_log: getDefaultLearningLog(),
    weekly_review: getDefaultWeeklyReview(),
    stock_tasks: getDefaultStockTasks(),
    stock_entries: [],
    stock_active_task_id: null,
    today_generated_at: null,
  };
}

export function getCurrentPhase(week: number): PhaseKey {
  if (week <= 4) {
    return 1;
  }

  if (week <= 8) {
    return 2;
  }

  return 3;
}

export function createReportId(week: number, day: number) {
  return `week-${week}-day-${day}`;
}

export function createNewReportDate(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export const initialReports: DailyReport[] = [
  {
    id: "week-1-day-1",
    week: 1,
    day: 1,
    report_date: "04/14",
    score: 78,
    appearance_score: 72,
    behavior_score: 81,
    social_score: 60,
    inner_score: 78,
    learning_score: 84,
    cadence_status: "稳定起步",
    note: "先把起床、主任务块和睡前提醒跑通，节奏比强度更重要。",
    snapshot: {
      reminder_completion: 74,
      system_scores: {
        appearance: 72,
        behavior: 81,
        social: 60,
        inner: 78,
        learning: 84,
      },
      daily_focus: getDefaultDailyFocus(1),
      learning_log: getDefaultLearningLog(),
    },
  },
  {
    id: "week-1-day-2",
    week: 1,
    day: 2,
    report_date: "04/15",
    score: 82,
    appearance_score: 76,
    behavior_score: 85,
    social_score: 65,
    inner_score: 80,
    learning_score: 86,
    cadence_status: "完成度上升",
    note: "深度块更扎实，晚上的失控窗口明显缩小。",
    snapshot: {
      reminder_completion: 82,
      system_scores: {
        appearance: 76,
        behavior: 85,
        social: 65,
        inner: 80,
        learning: 86,
      },
      daily_focus: getDefaultDailyFocus(1),
      learning_log: getDefaultLearningLog(),
    },
  },
  {
    id: "week-1-day-3",
    week: 1,
    day: 3,
    report_date: "04/16",
    score: 75,
    appearance_score: 70,
    behavior_score: 76,
    social_score: 58,
    inner_score: 74,
    learning_score: 79,
    cadence_status: "主体保住了",
    note: "状态一般，但保底版本没掉线，记录也有回写。",
    snapshot: {
      reminder_completion: 71,
      system_scores: {
        appearance: 70,
        behavior: 76,
        social: 58,
        inner: 74,
        learning: 79,
      },
      daily_focus: getDefaultDailyFocus(1),
      learning_log: getDefaultLearningLog(),
    },
  },
];

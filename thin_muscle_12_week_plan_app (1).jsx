import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Flame,
  Salad,
  CalendarDays,
  Activity,
  Target,
  CheckCircle2,
  FileBarChart2,
  Footprints,
  Droplets,
  MoonStar,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  BookOpen,
  ChefHat,
  LayoutDashboard,
  Database,
  ShieldCheck,
  WandSparkles,
  Smartphone,
  Monitor,
} from "lucide-react";

const STORAGE_KEY = "thin-muscle-app-v3";

const profile = {
  name: "Cornelius",
  sex: "男",
  age: 23,
  heightCm: 181,
  weightKg: 75,
  goal: "12周内做出更干净的薄肌线条：轻降脂、保肌、提升胸肩背和核心轮廓",
  targetCalories: { train: 2250, rest: 2050 },
  protein: 150,
  fat: 60,
  carbsTrain: 250,
  carbsRest: 190,
  steps: 10000,
  water: 3.0,
  sleep: 7.5,
};

const phaseMeta = {
  1: { title: "第1阶段：建立基础与掉脂启动", weeks: "第1–4周", focus: "动作稳定、训练容量建立、轻热量缺口、有氧习惯化", target: "体重缓慢下降，围度变紧" },
  2: { title: "第2阶段：强化线条", weeks: "第5–8周", focus: "维持力量、提高训练质量、控制饮食波动、加强胸肩背视觉", target: "肩胸背更立体，腰腹更干净" },
  3: { title: "第3阶段：巩固薄肌感", weeks: "第9–12周", focus: "继续低幅减脂或轻体态重组，收口腰腹，保住训练表现", target: "线条更稳定，拍照和穿衣效果更好" },
};

const split = [
  { day: 1, title: "胸 + 三头 + 核心 + 间歇", type: "训练日" },
  { day: 2, title: "背 + 二头 + 坡度有氧", type: "训练日" },
  { day: 3, title: "腿 + 核心 + 低强度有氧", type: "训练日" },
  { day: 4, title: "恢复 / 快走 / 拉伸", type: "恢复日" },
  { day: 5, title: "肩 + 手臂 + 间歇", type: "训练日" },
  { day: 6, title: "胸背综合 + 核心 + 坡度有氧", type: "训练日" },
  { day: 7, title: "腿后侧/臀 + 肩后束 + 轻有氧", type: "训练日" },
];

const exerciseCatalog = {
  1: [
    { name: "平板杠铃卧推", machine: "卧推架/杠铃", sets: "4组", reps: "6–8次", muscles: "胸大肌、前三角、肱三头", kcal: 42, kind: "lift", cue: "肩胛后缩下沉，脚踩实地面，杠铃下放到下胸附近，推起时保持胸顶住。", fit: "感觉胸发力而不是肩前顶；下放可控，推起不歪。", mistakes: "肘外张过大、屁股乱抬、耸肩、弹胸借力。", steps: ["躺稳，眼睛在杠铃正下方。", "握距略宽于肩，肩胛夹紧。", "吸气下放到下胸。", "脚蹬地，把杠铃稳定推起。"] },
    { name: "上斜哑铃卧推", machine: "上斜凳+哑铃", sets: "4组", reps: "8–10次", muscles: "上胸、前三角、肱三头", kcal: 38, kind: "lift", cue: "凳子角度别太高，30–45°即可；哑铃下放到胸外侧，推起时向上向内。", fit: "顶端能感觉上胸夹紧，肩前压迫感不要太强。", mistakes: "凳子过高练成肩推、手腕后折、动作过快。", steps: ["调整凳子到30–45°。", "哑铃举到肩上方。", "缓慢下放到胸外侧。", "向上推并轻微内收。"] },
    { name: "器械推胸", machine: "推胸机", sets: "3组", reps: "10–12次", muscles: "胸大肌", kcal: 26, kind: "lift", cue: "背部贴靠垫，胸主动顶起来，推到接近伸直即可。", fit: "胸持续有张力，动作稳定不晃。", mistakes: "耸肩、锁死手肘、借惯性。", steps: ["调座位到手柄与胸中线平齐。", "胸打开，握稳手柄。", "匀速推出。", "慢慢回到起点。"] },
    { name: "绳索夹胸", machine: "龙门架", sets: "3组", reps: "12–15次", muscles: "胸内收、胸部泵感", kcal: 22, kind: "lift", cue: "肘微屈固定，像抱树一样把手臂往前内收。", fit: "胸中缝发热，顶端明显夹紧。", mistakes: "手肘角度变化太大、身体前后乱摆。", steps: ["双手握把，身体前倾小步站稳。", "手臂微屈打开。", "往前内收，像抱大树。", "顶峰停1秒再还原。"] },
    { name: "绳索下压", machine: "绳索下压机", sets: "3组", reps: "12–15次", muscles: "肱三头", kcal: 18, kind: "lift", cue: "手肘钉在身体两侧，只让前臂动。", fit: "三头下段发胀，肩不抢力。", mistakes: "身体下压、手肘乱飞。", steps: ["站稳，手肘夹住身体。", "前臂向下压。", "底部伸直挤压。", "控制还原。"] },
    { name: "悬垂举腿", machine: "单杠/举腿架", sets: "3组", reps: "10–15次", muscles: "下腹、髂腰肌", kcal: 16, kind: "core", cue: "先后倾骨盆，再抬腿，不要全程甩。", fit: "下腹收缩明显。", mistakes: "摆腿、耸肩、下背代偿。", steps: ["肩膀稳定撑住。", "骨盆后倾。", "抬腿到控制范围。", "慢慢下放。"] },
    { name: "绳索卷腹", machine: "龙门架", sets: "3组", reps: "12–15次", muscles: "腹直肌", kcal: 14, kind: "core", cue: "想象胸骨去找骨盆，是卷而不是单纯往下压。", fit: "腹直肌灼烧感强。", mistakes: "用手臂拉、屁股往后坐。", steps: ["跪姿握绳。", "收紧腹部。", "卷起上半身。", "慢慢回到起始。"] },
    { name: "跑步机间歇", machine: "跑步机", sets: "20分钟", reps: "1分快跑+1.5分走 × 8", muscles: "心肺、腿部耐力、整体热量消耗", kcal: 220, kind: "cardio", cue: "快跑段要明显喘，恢复段别完全停。", fit: "心率拉起来但还能完成整轮。", mistakes: "一开始冲太快、后面崩掉。", steps: ["热身走3分钟。", "快跑1分钟。", "走路恢复1.5分钟。", "循环8轮，最后冷却。"] },
  ],
  2: [
    { name: "高位下拉", machine: "高位下拉机", sets: "4组", reps: "8–12次", muscles: "背阔肌、肱二头", kcal: 34, kind: "lift", cue: "先沉肩再拉肘，杆往上胸走。", fit: "腋下到背阔有明显收缩。", mistakes: "后仰太多、耸肩、用手臂硬拉。", steps: ["坐稳固定腿。", "宽握横杆。", "先沉肩再拉下。", "慢慢还原。"] },
    { name: "杠铃划船", machine: "杠铃", sets: "4组", reps: "8–10次", muscles: "背阔、菱形肌、下背", kcal: 40, kind: "lift", cue: "髋部后坐，躯干固定，肘往后划。", fit: "中背厚度和背阔都有参与。", mistakes: "猛甩上身、下背乱晃。", steps: ["俯身固定角度。", "核心收紧。", "杠铃拉向腹部。", "控制下放。"] },
    { name: "坐姿划船", machine: "坐姿划船机", sets: "3组", reps: "10–12次", muscles: "中背厚度", kcal: 26, kind: "lift", cue: "挺胸，先收肩胛再拉手。", fit: "肩胛骨向后夹紧明显。", mistakes: "含胸、耸肩、身体后仰借力。", steps: ["脚踩稳，胸打开。", "先夹肩胛。", "拉到腹部。", "慢放。"] },
    { name: "直臂下压", machine: "龙门架", sets: "3组", reps: "12–15次", muscles: "背阔肌下缘", kcal: 17, kind: "lift", cue: "手臂角度固定，用背把杆压下去。", fit: "背阔下缘发力明显。", mistakes: "手肘弯太多，练成三头。", steps: ["站稳前倾。", "手臂微屈固定。", "向下压到大腿前。", "控制还原。"] },
    { name: "杠铃弯举", machine: "杠铃", sets: "3组", reps: "8–10次", muscles: "肱二头", kcal: 19, kind: "lift", cue: "手肘别往前乱跑，顶端挤压。", fit: "二头前侧鼓胀。", mistakes: "上身晃太多、借腰。", steps: ["站稳握杠。", "手肘固定。", "弯起到顶端。", "慢慢下放。"] },
    { name: "上斜哑铃弯举", machine: "上斜凳+哑铃", sets: "3组", reps: "10–12次", muscles: "肱二头拉伸位", kcal: 18, kind: "lift", cue: "肩别前跑，享受底部拉伸。", fit: "二头拉伸感很强。", mistakes: "肩往前顶、动作太快。", steps: ["坐稳靠凳。", "手臂自然垂下。", "弯举到顶端。", "控制下放到底。"] },
    { name: "跑步机坡度走", machine: "跑步机", sets: "25分钟", reps: "坡度8–12，速度3.0–3.8", muscles: "心肺、臀腿、脂肪消耗", kcal: 210, kind: "cardio", cue: "步幅稳定，别一直扶把手。", fit: "能持续喘但可以坚持。", mistakes: "全程扶把手、速度太低。", steps: ["设置坡度和速度。", "身体略前倾。", "稳定摆臂走。", "持续25分钟。"] },
  ],
  3: [
    { name: "杠铃深蹲", machine: "深蹲架", sets: "4组", reps: "6–8次", muscles: "股四头、臀、大腿后侧、核心", kcal: 48, kind: "lift", cue: "脚踩稳，膝盖跟脚尖方向一致，向下坐到髋膝协同。", fit: "腿和臀同时发力，腰不顶。", mistakes: "塌腰、膝内扣、蹲太浅。", steps: ["杠铃放稳上背。", "吸气撑腹。", "坐下到控制深度。", "脚蹬地站起。"] },
    { name: "腿举", machine: "腿举机", sets: "4组", reps: "10–12次", muscles: "股四头、臀", kcal: 34, kind: "lift", cue: "下放时臀别离座，推起不要锁死。", fit: "大腿前侧和臀都明显发力。", mistakes: "下放过深导致骨盆卷。", steps: ["脚放平台中高位。", "慢慢下放。", "脚掌发力推起。", "保持膝微屈。"] },
    { name: "保加利亚分腿蹲", machine: "哑铃+长凳", sets: "3组", reps: "10次/侧", muscles: "臀、股四头、稳定", kcal: 30, kind: "lift", cue: "前脚踩稳，重心放前腿。", fit: "前腿臀和股四明显吃力。", mistakes: "后腿用力太多、身体晃。", steps: ["后脚放凳上。", "前脚调整到合适距离。", "垂直下蹲。", "前脚发力站起。"] },
    { name: "腿屈伸", machine: "腿屈伸机", sets: "3组", reps: "12–15次", muscles: "股四头", kcal: 18, kind: "lift", cue: "顶端挤压1秒。", fit: "大腿前侧灼烧。", mistakes: "借甩。", steps: ["调整靠垫。", "抬起小腿。", "顶端夹紧。", "慢放。"] },
    { name: "腿弯举", machine: "腿弯举机", sets: "3组", reps: "12–15次", muscles: "腘绳肌", kcal: 18, kind: "lift", cue: "脚跟往臀部拉。", fit: "大腿后侧收缩明显。", mistakes: "甩重量。", steps: ["趴稳。", "脚勾住滚轴。", "弯曲到顶。", "慢放。"] },
    { name: "站姿提踵", machine: "提踵机", sets: "4组", reps: "12–20次", muscles: "小腿", kcal: 15, kind: "lift", cue: "全程到底再踮高。", fit: "小腿胀痛明显。", mistakes: "半程。", steps: ["脚掌踩台边。", "落到底。", "踮到最高。", "控制回落。"] },
    { name: "俄罗斯转体", machine: "地面/药球", sets: "3组", reps: "20次", muscles: "腹斜肌", kcal: 12, kind: "core", cue: "躯干一起转，不只是手摆。", fit: "侧腹有持续张力。", mistakes: "纯甩手。", steps: ["坐稳，脚可抬可不抬。", "收紧核心。", "左右转体。", "保持节奏。"] },
    { name: "单车低强度", machine: "动感单车", sets: "20分钟", reps: "匀速", muscles: "恢复、心肺、轻热量消耗", kcal: 150, kind: "cardio", cue: "匀速别冲。", fit: "微喘、偏恢复。", mistakes: "踩太猛。", steps: ["调座位。", "匀速踩。", "保持20分钟。", "冷却。"] },
  ],
  4: [
    { name: "快走", machine: "跑步机/室外", sets: "40–60分钟", reps: "轻快节奏", muscles: "恢复、NEAT提升、心肺", kcal: 180, kind: "cardio", cue: "步频稳定，不要太散。", fit: "轻喘、可持续。", mistakes: "走走停停。", steps: ["设定时间。", "轻快走。", "摆臂。", "走完整段。"] },
    { name: "拉伸", machine: "垫子", sets: "15分钟", reps: "全身", muscles: "恢复、活动度", kcal: 30, kind: "mobility", cue: "到紧不疼的位置停留。", fit: "身体放松。", mistakes: "暴力拉。", steps: ["胸肩拉伸。", "髋部拉伸。", "腿后侧拉伸。", "呼吸放松。"] },
    { name: "平板支撑", machine: "地面", sets: "3组", reps: "45–60秒", muscles: "核心稳定", kcal: 10, kind: "core", cue: "收腹夹臀，身体一条线。", fit: "腹部持续紧。", mistakes: "塌腰、撅屁股。", steps: ["肘在肩下。", "夹臀收腹。", "保持一条线。", "坚持时间。"] },
  ],
  5: [
    { name: "哑铃肩推", machine: "坐姿凳+哑铃", sets: "4组", reps: "6–8次", muscles: "三角肌前束、中束", kcal: 32, kind: "lift", cue: "核心收紧，往上推时别耸肩。", fit: "肩部整体发力。", mistakes: "腰过分反弓。", steps: ["坐稳背靠凳。", "哑铃置于肩旁。", "向上推。", "控制下放。"] },
    { name: "哑铃侧平举", machine: "哑铃", sets: "4组", reps: "12–15次", muscles: "三角肌中束", kcal: 20, kind: "lift", cue: "小指略高，肘带手走。", fit: "中束灼烧。", mistakes: "借摆。", steps: ["双手持哑铃。", "微屈肘。", "侧抬到肩高附近。", "慢放。"] },
    { name: "俯身飞鸟", machine: "哑铃/反向蝴蝶机", sets: "4组", reps: "12–15次", muscles: "三角肌后束", kcal: 20, kind: "lift", cue: "肩胛稳定，用后束打开。", fit: "肩后束酸胀。", mistakes: "上斜方代偿。", steps: ["俯身固定。", "手臂微屈。", "向两侧打开。", "控制还原。"] },
    { name: "面拉", machine: "龙门架", sets: "3组", reps: "15次", muscles: "后束、肩胛稳定", kcal: 14, kind: "lift", cue: "绳子拉向眉眼位置。", fit: "后束和上背都参与。", mistakes: "拉太低。", steps: ["绳索调高。", "拉向脸。", "肘外展。", "慢还原。"] },
    { name: "窄握卧推", machine: "杠铃", sets: "3组", reps: "8–10次", muscles: "肱三头、胸", kcal: 28, kind: "lift", cue: "握距略窄，不要窄到手腕难受。", fit: "三头压力大于胸。", mistakes: "握太窄。", steps: ["握距略窄于肩。", "下放控制。", "推起。", "保持手腕中立。"] },
    { name: "锤式弯举", machine: "哑铃", sets: "3组", reps: "10–12次", muscles: "肱肌、前臂、肱二头", kcal: 18, kind: "lift", cue: "掌心相对，稳定上抬。", fit: "前臂和肱肌明显。", mistakes: "甩腰。", steps: ["站稳。", "哑铃中立握。", "弯起。", "慢放。"] },
    { name: "跑步机冲刺间歇", machine: "跑步机", sets: "20分钟", reps: "30秒冲刺+90秒恢复 × 10", muscles: "心肺、脂肪消耗", kcal: 220, kind: "cardio", cue: "冲刺真冲，恢复真恢复。", fit: "短时间心率拉高。", mistakes: "冲刺段太保守。", steps: ["热身。", "30秒冲刺。", "90秒恢复。", "循环10轮。"] },
  ],
  6: [
    { name: "上斜卧推", machine: "杠铃/哑铃", sets: "4组", reps: "8–10次", muscles: "上胸", kcal: 35, kind: "lift", cue: "角度别太高，胸发力优先。", fit: "上胸夹紧。", mistakes: "变成肩推。", steps: ["设定角度。", "稳住肩胛。", "下放到胸外侧。", "推起。"] },
    { name: "高位下拉", machine: "高位下拉机", sets: "4组", reps: "10–12次", muscles: "背阔", kcal: 30, kind: "lift", cue: "先沉肩再拉。", fit: "背阔下压感。", mistakes: "耸肩。", steps: ["固定坐姿。", "拉向上胸。", "停一下。", "慢放。"] },
    { name: "器械推胸", machine: "推胸机", sets: "3组", reps: "12次", muscles: "胸", kcal: 24, kind: "lift", cue: "胸持续张力。", fit: "胸泵感。", mistakes: "锁肘。", steps: ["调座位。", "推出。", "停顿。", "慢还原。"] },
    { name: "坐姿划船", machine: "划船机", sets: "3组", reps: "12次", muscles: "中背", kcal: 22, kind: "lift", cue: "胸打开。", fit: "中背夹紧。", mistakes: "含胸。", steps: ["坐稳。", "收肩胛。", "拉向腹部。", "慢放。"] },
    { name: "绳索夹胸", machine: "龙门架", sets: "3组", reps: "15次", muscles: "胸部泵感", kcal: 18, kind: "lift", cue: "抱树动作。", fit: "胸中缝收缩。", mistakes: "甩。", steps: ["站稳。", "打开。", "内收。", "停顿。"] },
    { name: "直臂下压", machine: "龙门架", sets: "3组", reps: "15次", muscles: "背阔下缘", kcal: 16, kind: "lift", cue: "用背压下去。", fit: "背阔下缘酸。", mistakes: "手臂代偿。", steps: ["前倾。", "手臂固定。", "压下。", "慢放。"] },
    { name: "绳索卷腹", machine: "龙门架", sets: "3组", reps: "15次", muscles: "腹直肌", kcal: 14, kind: "core", cue: "卷而不是压。", fit: "腹部灼烧。", mistakes: "手拉。", steps: ["跪姿。", "收腹。", "卷起。", "还原。"] },
    { name: "坡度走", machine: "跑步机", sets: "25分钟", reps: "坡度10左右", muscles: "心肺、臀腿、热量消耗", kcal: 210, kind: "cardio", cue: "稳定走，不要扶。", fit: "微喘。", mistakes: "速度太低。", steps: ["设坡度。", "走。", "摆臂。", "走完整段。"] },
  ],
  7: [
    { name: "罗马尼亚硬拉", machine: "杠铃", sets: "4组", reps: "8–10次", muscles: "腘绳肌、臀、下背", kcal: 42, kind: "lift", cue: "髋主导后移，杠贴腿。", fit: "腿后侧拉伸和臀发力。", mistakes: "弯腰找地。", steps: ["站稳握杠。", "髋后移。", "下放到小腿附近。", "臀发力站起。"] },
    { name: "臀推", machine: "杠铃/臀推机", sets: "4组", reps: "8–12次", muscles: "臀大肌", kcal: 34, kind: "lift", cue: "下巴微收，顶端夹臀。", fit: "臀顶峰收缩很强。", mistakes: "腰过分顶。", steps: ["上背靠凳。", "脚踩稳。", "顶髋。", "停顿后下放。"] },
    { name: "俯卧腿弯举", machine: "腿弯举机", sets: "4组", reps: "10–12次", muscles: "大腿后侧", kcal: 20, kind: "lift", cue: "脚跟找臀。", fit: "腿后侧强收缩。", mistakes: "甩。", steps: ["趴稳。", "弯曲。", "停顿。", "慢放。"] },
    { name: "行走弓步", machine: "哑铃", sets: "3组", reps: "12步/侧", muscles: "臀、股四头、稳定", kcal: 28, kind: "lift", cue: "跨步稳，膝盖朝前。", fit: "臀腿都参与。", mistakes: "步幅乱。", steps: ["手持哑铃。", "向前跨步。", "下蹲。", "换腿前进。"] },
    { name: "反向蝴蝶机", machine: "反向飞鸟机", sets: "4组", reps: "12–15次", muscles: "肩后束", kcal: 18, kind: "lift", cue: "肩别耸。", fit: "后束发力。", mistakes: "斜方代偿。", steps: ["调整座位。", "握把。", "向后打开。", "慢还原。"] },
    { name: "绳索弯举+下压", machine: "龙门架", sets: "各3组", reps: "15次", muscles: "手臂收尾", kcal: 24, kind: "lift", cue: "双向超级组，节奏紧凑。", fit: "手臂泵感明显。", mistakes: "动作变形。", steps: ["先弯举。", "接下压。", "少休息。", "重复。"] },
    { name: "椭圆机", machine: "椭圆机", sets: "20分钟", reps: "匀速", muscles: "恢复、心肺", kcal: 170, kind: "cardio", cue: "匀速不中断。", fit: "轻中强度。", mistakes: "阻力乱变。", steps: ["设阻力。", "匀速踩。", "保持20分钟。", "冷却。"] },
  ],
};

const mealLibrary = {
  breakfast: [
    { name: "燕麦碗", items: "燕麦60g + 希腊酸奶250g + 蓝莓100g + 乳清1勺", protein: 43, carbs: 58, fat: 7, kcal: 460, recipe: ["燕麦加热水或牛奶泡开。", "加入希腊酸奶拌匀。", "放上蓝莓。", "最后加入乳清或单独摇匀喝掉。"], tips: "适合早上时间紧但又要高蛋白。" },
    { name: "鸡蛋吐司盘", items: "全蛋2个 + 蛋清4个 + 全麦吐司4片 + 香蕉1根", protein: 36, carbs: 55, fat: 13, kcal: 490, recipe: ["鸡蛋和蛋清一起煎或炒。", "吐司烤热。", "香蕉直接搭配吃。", "也可以做成鸡蛋吐司夹心。"], tips: "训练日前早餐很稳，制作也快。" },
    { name: "中式轻健身早餐", items: "无糖豆浆500ml + 鸡蛋3个 + 玉米1根 + 无糖酸奶1杯", protein: 34, carbs: 42, fat: 16, kcal: 430, recipe: ["豆浆直接加热。", "鸡蛋水煮或煎。", "玉米蒸熟。", "酸奶直接搭配。"], tips: "更像中式口味，恢复日也很适合。" },
  ],
  lunch: [
    { name: "鸡胸饭", items: "鸡胸220g + 米饭250g熟重 + 西兰花300g", protein: 56, carbs: 72, fat: 8, kcal: 590, recipe: ["鸡胸切片，加黑胡椒、蒜粉、少量盐腌10分钟。", "平底锅少油煎熟或空气炸锅烤熟。", "米饭提前煮好。", "西兰花焯水或蒸熟。"], tips: "最适合批量备餐，周内高频使用。" },
    { name: "牛肉土豆盘", items: "瘦牛肉180g + 土豆300g + 生菜沙拉", protein: 42, carbs: 55, fat: 13, kcal: 510, recipe: ["牛肉切片快炒。", "土豆切块烤或水煮。", "生菜洗净做沙拉。", "可加一点低脂酱汁。"], tips: "饱腹感很强，背日和肩日都适合。" },
    { name: "三文鱼藜麦盘", items: "三文鱼180g + 藜麦180g熟重 + 蔬菜", protein: 41, carbs: 42, fat: 18, kcal: 520, recipe: ["三文鱼撒盐和黑胡椒煎或烤。", "藜麦提前煮熟。", "蔬菜简单蒸熟或快炒。", "装盘即可。"], tips: "恢复日很好，脂肪质量高。" },
  ],
  pre: [
    { name: "训练前轻食A", items: "香蕉1根 + 乳清1勺", protein: 24, carbs: 27, fat: 2, kcal: 220, recipe: ["香蕉直接吃。", "乳清加水摇匀。"], tips: "最省事，适合赶时间。" },
    { name: "训练前轻食B", items: "低糖酸奶1杯 + 全麦面包2片", protein: 18, carbs: 28, fat: 4, kcal: 220, recipe: ["酸奶直接吃。", "面包烤热即可。"], tips: "不想喝乳清时用这个。" },
    { name: "训练前轻食C", items: "米饼4片 + 火鸡胸肉80g", protein: 19, carbs: 30, fat: 1, kcal: 210, recipe: ["米饼直接吃。", "火鸡胸肉夹着吃或分开吃。"], tips: "低脂高碳，适合训练前1小时左右。" },
  ],
  dinner: [
    { name: "虾仁饭", items: "虾仁250g + 米饭220g熟重 + 芦笋", protein: 52, carbs: 63, fat: 4, kcal: 500, recipe: ["虾仁加黑胡椒和蒜末快炒。", "米饭提前煮好。", "芦笋煎或焯水。", "一起装盘。"], tips: "训练后很干净，消化也快。" },
    { name: "鸡腿去皮盘", items: "去皮鸡腿250g + 红薯300g + 蔬菜", protein: 48, carbs: 58, fat: 11, kcal: 540, recipe: ["鸡腿去皮后加调味料烤或煎。", "红薯蒸熟。", "蔬菜简单炒或蒸。", "按盘装好。"], tips: "比鸡胸更香，更容易长期坚持。" },
    { name: "牛肉意面盘", items: "瘦牛肉180g + 意面80g生重 + 番茄酱", protein: 43, carbs: 62, fat: 12, kcal: 560, recipe: ["意面煮熟。", "牛肉炒熟。", "加番茄酱略煮。", "和意面拌匀。"], tips: "适合训练量大的日子，满足感更强。" },
  ],
  snack: [
    { name: "夜间补蛋白A", items: "脱脂牛奶300ml + 低脂奶酪", protein: 23, carbs: 14, fat: 6, kcal: 210, recipe: ["牛奶直接喝。", "奶酪单独吃。"], tips: "简单直接。" },
    { name: "夜间补蛋白B", items: "无糖酸奶250g + 杏仁15g", protein: 20, carbs: 12, fat: 8, kcal: 210, recipe: ["酸奶装碗。", "杏仁撒上即可。"], tips: "想吃点口感时用这个。" },
    { name: "夜间补蛋白C", items: "嫩豆腐300g + 酱油海苔", protein: 18, carbs: 8, fat: 9, kcal: 180, recipe: ["豆腐切块。", "淋一点酱油。", "配海苔吃。"], tips: "偏中式，晚上更清爽。" },
  ],
};

const weeklyProgression = Array.from({ length: 12 }, (_, i) => {
  const week = i + 1;
  const phase = week <= 4 ? 1 : week <= 8 ? 2 : 3;
  return {
    week,
    phase,
    intensity: phase === 1 ? (week <= 2 ? "RPE 7" : "RPE 7.5–8") : phase === 2 ? (week <= 6 ? "RPE 8" : "RPE 8–8.5") : week === 9 ? "第9周小幅回撤" : "RPE 8–8.5",
    cardio: phase === 1 ? "每周3次" : phase === 2 ? "每周4次" : "每周4次，强度微调",
    note: week === 4 ? "本周观察体重与围度，如无变化可每日减100–150 kcal" : week === 9 ? "减量周：力量动作组数减20%，保持动作质量" : week === 12 ? "收官周：拍照、测体重、围度复盘" : "按计划推进",
  };
});

const initialHistory = [
  { id: 1, week: 1, day: 1, date: "04-14", score: 82, weight: 75.2, steps: 10240, protein: 148, sleep: 7.6, workoutStatus: "已完成" },
  { id: 2, week: 1, day: 2, date: "04-15", score: 78, weight: 75.0, steps: 9680, protein: 152, sleep: 7.2, workoutStatus: "已完成" },
  { id: 3, week: 1, day: 3, date: "04-16", score: 73, weight: 74.9, steps: 8450, protein: 143, sleep: 6.9, workoutStatus: "部分完成" },
  { id: 4, week: 1, day: 4, date: "04-17", score: 76, weight: 74.8, steps: 12030, protein: 146, sleep: 7.8, workoutStatus: "已完成" },
  { id: 5, week: 1, day: 5, date: "04-18", score: 84, weight: 74.8, steps: 11120, protein: 154, sleep: 7.7, workoutStatus: "已完成" },
  { id: 6, week: 1, day: 6, date: "04-19", score: 80, weight: 74.7, steps: 10890, protein: 150, sleep: 7.4, workoutStatus: "已完成" },
];

function sumMeals(selection) {
  return Object.values(selection).reduce(
    (acc, cur) => ({ protein: acc.protein + cur.protein, carbs: acc.carbs + cur.carbs, fat: acc.fat + cur.fat, kcal: acc.kcal + cur.kcal }),
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  );
}

function getDailyRecommendation(dayNum) {
  const map = {
    1: { title: "优先做胸推主动作，今天的视觉重心是上胸和胸肩轮廓", focus: "先完成卧推和上斜卧推，再做胸部孤立和核心，最后用间歇把体脂控制补足。", caution: "卧推别一开始冲太猛，前两组保守一点，保证后面还能稳定输出。" },
    2: { title: "今天是背阔与中背厚度日，重点做出倒三角基础", focus: "先拉宽再拉厚，高位下拉和杠铃划船是主菜，有氧用坡度走补热量缺口。", caution: "划船时别耸肩，避免用手臂抢太多发力。" },
    3: { title: "今天是腿和核心主推进日，决定整体比例和代谢水平", focus: "深蹲和腿举优先完成，单侧动作控制好稳定性，最后低强度有氧做恢复。", caution: "深蹲重量服从动作质量，宁可稳一点，也不要塌腰乱顶。" },
    4: { title: "今天是恢复日，但不是躺平日", focus: "把快走、拉伸、轻核心做完整，拉高步数和恢复质量，这会直接影响后面训练表现。", caution: "别因为是恢复日就乱吃，恢复日更容易热量超标。" },
    5: { title: "今天是肩和手臂视觉强化日，直接决定穿衣显不显壮", focus: "肩推和侧平举优先，后束别偷，最后用短间歇提整体消耗。", caution: "侧平举别摆太大，宁可轻一点也要持续给中束张力。" },
    6: { title: "今天是胸背综合泵感日，增强上半身立体感", focus: "用推拉交替提高密度，最后加核心和坡度有氧，兼顾塑形和热量缺口。", caution: "今天节奏会快，动作切换前先把呼吸调整好。" },
    7: { title: "今天是后链和肩后束修饰日，让身材更完整", focus: "臀腿后侧和肩后束练到位，会让体态和轮廓高级很多。", caution: "硬拉类动作全程收紧核心，避免下背抢力。" },
  };
  return map[dayNum];
}

function getRecommendedMeals(dayNum) {
  const trainingMap = {
    1: { breakfast: mealLibrary.breakfast[0], lunch: mealLibrary.lunch[0], pre: mealLibrary.pre[0], dinner: mealLibrary.dinner[0], snack: mealLibrary.snack[0], reason: "胸推和间歇日需要更稳的碳水与高蛋白，保证上肢输出和恢复。" },
    2: { breakfast: mealLibrary.breakfast[1], lunch: mealLibrary.lunch[1], pre: mealLibrary.pre[2], dinner: mealLibrary.dinner[2], snack: mealLibrary.snack[1], reason: "背部训练量较大，午晚餐给足主食和蛋白，提升拉的表现与恢复。" },
    3: { breakfast: mealLibrary.breakfast[1], lunch: mealLibrary.lunch[0], pre: mealLibrary.pre[0], dinner: mealLibrary.dinner[1], snack: mealLibrary.snack[0], reason: "腿日最吃糖原，今天优先高碳水、高蛋白，帮助下肢训练和恢复。" },
    4: { breakfast: mealLibrary.breakfast[2], lunch: mealLibrary.lunch[2], pre: mealLibrary.pre[1], dinner: mealLibrary.dinner[0], snack: mealLibrary.snack[2], reason: "恢复日把热量略收一点，但蛋白不能掉，帮助恢复又不容易吃超。" },
    5: { breakfast: mealLibrary.breakfast[0], lunch: mealLibrary.lunch[1], pre: mealLibrary.pre[2], dinner: mealLibrary.dinner[2], snack: mealLibrary.snack[1], reason: "肩臂日要维持上肢泵感和间歇输出，所以用中高碳配高蛋白。" },
    6: { breakfast: mealLibrary.breakfast[0], lunch: mealLibrary.lunch[0], pre: mealLibrary.pre[0], dinner: mealLibrary.dinner[0], snack: mealLibrary.snack[1], reason: "胸背综合日密度高，推荐更稳的经典训练日搭配，便于执行。" },
    7: { breakfast: mealLibrary.breakfast[2], lunch: mealLibrary.lunch[1], pre: mealLibrary.pre[0], dinner: mealLibrary.dinner[1], snack: mealLibrary.snack[0], reason: "后链训练需要足够能量，但不必像腿主日那样高，保持平衡更合适。" },
  };
  return trainingMap[dayNum];
}

function clamp(val) {
  return Math.max(0, Math.min(100, Math.round(val)));
}

function getWeeklyGroceryPlan(weekNum) {
  const phaseNote = weekNum <= 4
    ? "这不是随便推荐你自己挑，而是按当前 7 天推荐饮食直接汇总出的整周采购单。正常执行一周，基本就是照着买、照着做、照着吃。"
    : weekNum <= 8
    ? "这份采购单按当前 7 天推荐饮食完整汇总，重点保证高蛋白和训练日前后碳水稳定。"
    : "这份采购单按当前 7 天推荐饮食完整汇总，重点是控制波动、维持线条和恢复。";
  const exactProtein = [
    { name: "鸡胸肉", qty: "约 3.5 lb", why: "覆盖鸡胸饭、部分训练日主蛋白" },
    { name: "去皮鸡腿", qty: "约 2.2 lb", why: "覆盖 2 顿鸡腿去皮盘" },
    { name: "瘦牛肉", qty: "约 2.4 lb", why: "覆盖牛肉土豆盘、牛肉意面盘" },
    { name: "虾仁", qty: "约 2.2 lb", why: "覆盖 2 顿虾仁饭" },
    { name: "鸡蛋", qty: "18 个", why: "覆盖早餐与中式早餐" },
    { name: "希腊酸奶/无糖酸奶", qty: "约 5.5–6.6 lb", why: "覆盖早餐、训练前和夜间加餐" },
    { name: "乳清蛋白", qty: "约 7 勺", why: "覆盖训练前轻食与燕麦碗" },
    { name: "脱脂牛奶", qty: "约 0.3 gal", why: "覆盖夜间补蛋白A" },
    { name: "低脂奶酪", qty: "约 0.66–0.9 lb", why: "覆盖夜间补蛋白A" },
    { name: "嫩豆腐", qty: "0.66 lb", why: "覆盖恢复日夜间补蛋白C" },
    { name: "无糖豆浆", qty: "0.26 gal", why: "覆盖 2 顿中式轻健身早餐" },
    { name: "火鸡胸肉", qty: "0.35 lb", why: "覆盖 2 次训练前轻食C" },
  ];
  const exactCarbs = [
    { name: "大米", qty: "约 3.5–4.0 lb（生重）", why: "覆盖鸡胸饭、虾仁饭等多顿主食" },
    { name: "燕麦", qty: "0.53 lb", why: "覆盖 4 顿燕麦碗" },
    { name: "全麦吐司", qty: "1.5–2 袋", why: "覆盖鸡蛋吐司盘与训练前轻食B" },
    { name: "香蕉", qty: "9–10 根", why: "覆盖早餐和训练前轻食A" },
    { name: "土豆", qty: "约 2.0 lb", why: "覆盖牛肉土豆盘" },
    { name: "红薯", qty: "约 1.3 lb", why: "覆盖鸡腿去皮盘" },
    { name: "玉米", qty: "2 根", why: "覆盖中式轻健身早餐" },
    { name: "意面", qty: "0.35 lb（生重）", why: "覆盖 2 顿牛肉意面盘" },
    { name: "藜麦", qty: "0.4 lb（熟重）或 0.15 lb（生重）", why: "覆盖 1 顿三文鱼藜麦盘" },
    { name: "米饼", qty: "1 包", why: "覆盖 2 次训练前轻食C" },
  ];
  const exactVegAndFats = [
    { name: "西兰花", qty: "约 3.3 lb", why: "覆盖鸡胸饭等高频蔬菜" },
    { name: "生菜/菠菜/综合叶菜", qty: "约 2.6–3.3 lb", why: "覆盖沙拉、配菜和体积感" },
    { name: "芦笋", qty: "约 0.9–1.1 lb", why: "覆盖虾仁饭配菜" },
    { name: "彩椒/番茄", qty: "约 1.3–1.8 lb", why: "覆盖晚餐和意面口味变化" },
    { name: "蓝莓", qty: "0.9 lb", why: "覆盖 4 顿燕麦碗" },
    { name: "杏仁", qty: "0.07 lb", why: "覆盖 2 次夜间补蛋白B" },
    { name: "橄榄油", qty: "1 小瓶", why: "基础烹饪与脂肪来源" },
    { name: "海苔/酱油", qty: "少量", why: "覆盖豆腐加餐" },
  ];
  return { phaseNote, exactProtein, exactCarbs, exactVegAndFats, prepTips: ["周初先把鸡胸、鸡腿、牛肉按单餐份量分装，避免临时估不准。", "米饭、红薯、土豆建议一次备 2–3 天量，训练后直接加热即可。", "酸奶、香蕉、乳清、吐司这类训练前后食材建议中途补一次货，避免后半周断档。"] };
}

function getDefaultExerciseChecks(dayNum) {
  const obj = {};
  exerciseCatalog[dayNum].forEach((_, idx) => { obj[idx] = false; });
  return obj;
}

function getDefaultGroceryChecks(weekNum) {
  const plan = getWeeklyGroceryPlan(weekNum);
  const items = [...plan.exactProtein, ...plan.exactCarbs, ...plan.exactVegAndFats];
  const obj = {};
  items.forEach((item) => { obj[item.name] = false; });
  return obj;
}

function MiniTrendChart({ data, dataKey, name }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={dataKey} name={name} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SuccessToast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg"
        >
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div>
            <div>
              <div className="font-medium">{toast.title}</div>
              <div className="text-xs text-slate-500">{toast.desc}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ThinMusclePlanApp() {
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedDay, setSelectedDay] = useState("1");
  const [mealSelection, setMealSelection] = useState({ breakfast: mealLibrary.breakfast[0], lunch: mealLibrary.lunch[0], pre: mealLibrary.pre[0], dinner: mealLibrary.dinner[0], snack: mealLibrary.snack[0] });
  const [checklist, setChecklist] = useState({ cardioDone: false, foodDone: false, stepsDone: false, waterDone: false, sleepDone: false });
  const [exerciseChecks, setExerciseChecks] = useState(getDefaultExerciseChecks(1));
  const [dailyLog, setDailyLog] = useState({ weight: "75.0", steps: 9000, water: 2.8, sleep: 7.5, energy: 8, note: "今天先稳稳执行，不求爆发，只求完整。" });
  const [history, setHistory] = useState(initialHistory);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [groceryChecksByWeek, setGroceryChecksByWeek] = useState({ 1: getDefaultGroceryChecks(1) });
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);
  const [todayGeneratedAt, setTodayGeneratedAt] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.selectedWeek) setSelectedWeek(parsed.selectedWeek);
        if (parsed.selectedDay) setSelectedDay(parsed.selectedDay);
        if (parsed.mealSelection) setMealSelection(parsed.mealSelection);
        if (parsed.checklist) setChecklist(parsed.checklist);
        if (parsed.exerciseChecks) setExerciseChecks(parsed.exerciseChecks);
        if (parsed.dailyLog) setDailyLog(parsed.dailyLog);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.groceryChecksByWeek) setGroceryChecksByWeek(parsed.groceryChecksByWeek);
        if (parsed.todayGeneratedAt) setTodayGeneratedAt(parsed.todayGeneratedAt);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = { selectedWeek, selectedDay, mealSelection, checklist, exerciseChecks, dailyLog, history, groceryChecksByWeek, todayGeneratedAt };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [hydrated, selectedWeek, selectedDay, mealSelection, checklist, exerciseChecks, dailyLog, history, groceryChecksByWeek, todayGeneratedAt]);

  useEffect(() => {
    const timer = toast ? setTimeout(() => setToast(null), 1800) : null;
    return () => timer && clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const day = Number(selectedDay);
    setChecklist({ cardioDone: false, foodDone: false, stepsDone: false, waterDone: false, sleepDone: false });
    setExerciseChecks(getDefaultExerciseChecks(day));
    setDailyLog((prev) => ({ ...prev, note: `第${selectedWeek}周 Day ${selectedDay}，按计划推进。` }));
  }, [selectedWeek, selectedDay]);

  const weekNum = Number(selectedWeek);
  const dayNum = Number(selectedDay);
  const phase = weekNum <= 4 ? 1 : weekNum <= 8 ? 2 : 3;
  const currentExercises = exerciseCatalog[dayNum];
  const trainingKcal = currentExercises.reduce((s, x) => s + x.kcal, 0);
  const mealTotals = useMemo(() => sumMeals(mealSelection), [mealSelection]);
  const targetKcal = dayNum === 4 ? profile.targetCalories.rest : profile.targetCalories.train;
  const targetCarbs = dayNum === 4 ? profile.carbsRest : profile.carbsTrain;
  const completedExercises = Object.values(exerciseChecks).filter(Boolean).length;
  const workoutProgress = currentExercises.length ? clamp((completedExercises / currentExercises.length) * 100) : 0;
  const workoutLoadReference = clamp((trainingKcal / 520) * 100);
  const exerciseCountDone = `${completedExercises} / ${currentExercises.length}`;
  const foodQuality = clamp((mealTotals.protein / profile.protein) * 55 + (Math.min(mealTotals.kcal, targetKcal) / targetKcal) * 45);
  const recoveryContribution = clamp((dailyLog.sleep / profile.sleep) * 55 + (dailyLog.water / profile.water) * 45);
  const executionDoneCount = Object.values(checklist).filter(Boolean).length + (workoutProgress === 100 ? 1 : 0);
  const executionTotalCount = Object.keys(checklist).length + 1;
  const executionScore = clamp((executionDoneCount / executionTotalCount) * 100);
  const contribution = [
    { label: "胸肩背视觉", value: [1, 2, 5, 6].includes(dayNum) ? 85 : dayNum === 7 ? 35 : 20 },
    { label: "核心线条", value: [1, 3, 4, 6].includes(dayNum) ? 75 : 30 },
    { label: "体脂控制", value: currentExercises.some((e) => e.kind === "cardio") ? 80 : 45 },
    { label: "下肢比例", value: [3, 7].includes(dayNum) ? 88 : 25 },
  ];
  const totalContribution = [
    { label: "训练完成度", value: workoutProgress, desc: `基于动作逐项打卡：已完成 ${exerciseCountDone} 项` },
    { label: "饮食达标", value: foodQuality, desc: `当前饮食 ${mealTotals.kcal} kcal / 蛋白 ${mealTotals.protein}g` },
    { label: "恢复质量", value: recoveryContribution, desc: `睡眠 ${dailyLog.sleep}h / 饮水 ${dailyLog.water}L` },
    { label: "执行完成率", value: executionScore, desc: `今日已完成 ${executionDoneCount} / ${executionTotalCount} 项` },
  ];
  const reportSummary = {
    score: clamp(totalContribution.reduce((s, x) => s + x.value, 0) / totalContribution.length),
    status: executionScore >= 80 ? "今天完成得很扎实" : executionScore >= 50 ? "今天完成了主体，细节还能补" : "今天更像起步日，先把闭环跑起来",
    highlight: dayNum === 4 ? "恢复质量决定你后面训练能不能越练越好。" : getDailyRecommendation(dayNum).focus,
  };
  const todayRecommendation = getDailyRecommendation(dayNum);
  const recommendedMeals = getRecommendedMeals(dayNum);
  const recommendedMealTotals = sumMeals(recommendedMeals);
  const weeklyGroceryPlan = getWeeklyGroceryPlan(weekNum);
  const currentWeekHistory = history.filter((item) => item.week === weekNum);
  const weeklyTrend = {
    score: currentWeekHistory.length ? Math.round(currentWeekHistory.reduce((s, x) => s + x.score, 0) / currentWeekHistory.length) : 0,
    steps: currentWeekHistory.length ? Math.round(currentWeekHistory.reduce((s, x) => s + x.steps, 0) / currentWeekHistory.length) : 0,
    protein: currentWeekHistory.length ? Math.round(currentWeekHistory.reduce((s, x) => s + x.protein, 0) / currentWeekHistory.length) : 0,
    sleep: currentWeekHistory.length ? Math.round((currentWeekHistory.reduce((s, x) => s + x.sleep, 0) / currentWeekHistory.length) * 10) / 10 : 0,
  };
  const hasCardio = currentExercises.some((e) => e.kind === "cardio");
  const dashboardCards = [
    { label: "今日训练完成度", value: `${workoutProgress}%`, sub: `${exerciseCountDone} 动作完成` },
    { label: "今日饮食热量", value: `${mealTotals.kcal}`, sub: `目标 ${targetKcal} kcal` },
    { label: "今日执行率", value: `${executionScore}%`, sub: `${executionDoneCount}/${executionTotalCount} 项` },
    { label: "本周平均综合分", value: `${weeklyTrend.score}`, sub: `第 ${weekNum} 周` },
  ];

  const groceryItems = [...weeklyGroceryPlan.exactProtein, ...weeklyGroceryPlan.exactCarbs, ...weeklyGroceryPlan.exactVegAndFats];
  const groceryChecks = groceryChecksByWeek[weekNum] || getDefaultGroceryChecks(weekNum);
  const groceryDone = Object.values(groceryChecks).filter(Boolean).length;
  const groceryTotal = Object.keys(groceryChecks).length;
  const groceryProgress = groceryTotal ? clamp((groceryDone / groceryTotal) * 100) : 0;

  const showToast = (title, desc) => setToast({ title, desc, id: Date.now() });

  const generateTodayPlan = () => {
    setTodayGeneratedAt(new Date().toLocaleString());
    setMealSelection({ breakfast: recommendedMeals.breakfast, lunch: recommendedMeals.lunch, pre: recommendedMeals.pre, dinner: recommendedMeals.dinner, snack: recommendedMeals.snack });
    setExerciseChecks(getDefaultExerciseChecks(dayNum));
    showToast("今日执行已生成", `第${weekNum}周 Day ${dayNum} 已刷新为推荐版本`);
  };

  const applyRecommendedMeals = () => {
    setMealSelection({ breakfast: recommendedMeals.breakfast, lunch: recommendedMeals.lunch, pre: recommendedMeals.pre, dinner: recommendedMeals.dinner, snack: recommendedMeals.snack });
    showToast("饮食已应用", "今天的推荐饮食已经套用成功");
  };

  const saveDailyReport = () => {
    const statusText = workoutProgress === 100 ? "已完成" : workoutProgress > 0 ? "部分完成" : "未开始";
    const entry = { id: Date.now(), week: weekNum, day: dayNum, date: `W${weekNum}-D${dayNum}`, score: reportSummary.score, weight: Number(dailyLog.weight), steps: dailyLog.steps, protein: mealTotals.protein, sleep: dailyLog.sleep, workoutStatus: statusText };
    setHistory((prev) => [entry, ...prev.filter((x) => !(x.week === weekNum && x.day === dayNum))]);
    showToast("当日报告已生成", "今天的执行记录已经写入历史日报");
  };

  const toggleGrocery = (name) => {
    const current = (groceryChecksByWeek[weekNum] || getDefaultGroceryChecks(weekNum))[name];
    setGroceryChecksByWeek((prev) => ({
      ...prev,
      [weekNum]: {
        ...(prev[weekNum] || getDefaultGroceryChecks(weekNum)),
        [name]: !current,
      },
    }));
    showToast(!current ? "已加入已购" : "已取消勾选", `${name} ${!current ? "已标记为已购" : "恢复为未购"}`);
  };

  const toggleExerciseCheck = (idx, name) => {
    const next = !exerciseChecks[idx];
    setExerciseChecks((prev) => ({ ...prev, [idx]: next }));
    showToast(next ? "动作打卡成功" : "动作已取消打卡", `${name} ${next ? "已完成" : "恢复为未完成"}`);
  };

  const toggleChecklist = (key, label) => {
    const next = !checklist[key];
    setChecklist((prev) => ({ ...prev, [key]: next }));
    showToast(next ? "打卡成功" : "已取消打卡", `${label}${next ? " 已完成" : " 已恢复未完成"}`);
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const trendData = [...history]
    .sort((a, b) => a.id - b.id)
    .map((item) => ({ date: item.date, score: item.score, weight: item.weight, steps: item.steps, protein: item.protein, sleep: item.sleep }));

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-slate-600"><Target className="h-4 w-4" /> 12周薄肌计划 · 专属一阶段页面</div>
              <CardTitle className="text-2xl">{profile.name} 的 12 周健身 + 饮食执行台</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>{profile.sex} · {profile.age}岁 · {profile.heightCm}cm · {profile.weightKg}kg</p>
              <p>{profile.goal}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">训练日 {profile.targetCalories.train} kcal</Badge>
                <Badge variant="secondary">休息日 {profile.targetCalories.rest} kcal</Badge>
                <Badge variant="secondary">蛋白 {profile.protein}g+</Badge>
                <Badge variant="secondary">步数 {profile.steps}</Badge>
                <Badge variant="secondary">饮水 {profile.water}L</Badge>
                <Badge variant="secondary">睡眠 {profile.sleep}h</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardHeader><CardTitle className="text-lg">当前周期定位</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{phaseMeta[phase].title}</p>
              <p>{phaseMeta[phase].weeks}</p>
              <p className="text-slate-600">{phaseMeta[phase].focus}</p>
              <p className="text-slate-600">目标：{phaseMeta[phase].target}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Smartphone className="h-4 w-4" /> 手机适配</div>
              <div className="flex items-center gap-2 text-xs text-slate-500"><Monitor className="h-4 w-4" /> 电脑适配</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl sm:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="home">首页总览</TabsTrigger>
            <TabsTrigger value="plan">12周结构</TabsTrigger>
            <TabsTrigger value="today">当日推荐</TabsTrigger>
            <TabsTrigger value="workout">每日训练</TabsTrigger>
            <TabsTrigger value="food">每日饮食</TabsTrigger>
            <TabsTrigger value="dashboard">贡献/打卡/报表</TabsTrigger>
            <TabsTrigger value="history">历史/趋势</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map((card, idx) => (
                <Card key={idx} className="rounded-2xl shadow-sm">
                  <CardContent className="p-5">
                    <div className="text-sm text-slate-500">{card.label}</div>
                    <div className="mt-2 text-3xl font-semibold">{card.value}</div>
                    <div className="mt-1 text-xs text-slate-600">{card.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5" /> 今日总览</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="font-medium">今天要做什么</div>
                    <div className="mt-1">第{weekNum}周 · Day {dayNum} · {split[dayNum - 1].title}</div>
                    <div className="mt-2 text-slate-600">{todayRecommendation.focus}</div>
                    {todayGeneratedAt && <div className="mt-2 text-xs text-slate-500">最近一次生成：{todayGeneratedAt}</div>}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="font-medium">训练进度</div>
                      <div className="mt-2"><Progress value={workoutProgress} /></div>
                      <div className="mt-2 text-xs text-slate-600">已完成 {exerciseCountDone} 项</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="font-medium">采购进度</div>
                      <div className="mt-2"><Progress value={groceryProgress} /></div>
                      <div className="mt-2 text-xs text-slate-600">已购 {groceryDone} / {groceryTotal} 项</div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button className="rounded-2xl" onClick={generateTodayPlan}><WandSparkles className="mr-2 h-4 w-4" /> 生成今日执行</Button>
                    <Button variant="outline" className="rounded-2xl" onClick={applyRecommendedMeals}>一键应用今日饮食</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> 数据状态</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="font-medium">本地保存</div>
                    <div className="mt-1 text-xs">当前版本会把打卡、日报、购物勾选和饮食选择保存在本地浏览器中。</div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-xs text-slate-600">跨设备自动同步这件事，需要接入云端数据库和账号系统。当前版本还没有这层，所以同一浏览器内能保存，但不同设备不会自动同步。</div>
                  <div className="flex items-center gap-2 text-emerald-700"><Database className="h-4 w-4" /> {hydrated ? "本地数据已启用" : "正在读取本地数据"}</div>
                  <Button variant="outline" className="w-full rounded-2xl" onClick={resetAllData}>清空本地数据并重置</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {Object.values(phaseMeta).map((item, idx) => (
                <Card key={idx} className="rounded-2xl shadow-sm">
                  <CardHeader><CardTitle className="text-lg">{item.title}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-700">
                    <p>{item.weeks}</p>
                    <p>{item.focus}</p>
                    <p>结果：{item.target}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>按周推进</CardTitle>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="选择周数" /></SelectTrigger>
                    <SelectContent>{weeklyProgression.map((w) => <SelectItem key={w.week} value={String(w.week)}>第{w.week}周</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {weeklyProgression.map((w) => (
                  <div key={w.week} className={`rounded-2xl border p-3 ${w.week === weekNum ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">第{w.week}周 · 第{w.phase}阶段</div>
                      <Badge variant="outline">{w.intensity}</Badge>
                    </div>
                    <div className="mt-1 text-slate-600">有氧：{w.cardio} · {w.note}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle>固定周分化</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {split.map((s) => (
                  <div key={s.day} className="rounded-2xl border border-slate-200 p-3 text-sm">
                    <div className="font-medium">Day {s.day}</div>
                    <div>{s.title}</div>
                    <div className="mt-1 text-slate-500">{s.type}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> 当日推荐计划</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-lg font-medium">第{weekNum}周 · Day {dayNum} · {split[dayNum - 1].title}</div>
                    <div className="mt-2 text-sm text-slate-700">{todayRecommendation.title}</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                      <div className="rounded-2xl bg-white p-3"><div className="font-medium">今天先做什么</div><div className="mt-1 text-slate-600">{todayRecommendation.focus}</div></div>
                      <div className="rounded-2xl bg-white p-3"><div className="font-medium">今天要注意</div><div className="mt-1 text-slate-600">{todayRecommendation.caution}</div></div>
                      <div className="rounded-2xl bg-white p-3"><div className="font-medium">今天目标</div><div className="mt-1 text-slate-600">训练消耗约 {trainingKcal} kcal，饮食靠近 {targetKcal} kcal，步数达到 {profile.steps}。</div></div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 p-4 text-sm"><div className="text-slate-500">主训练动作数</div><div className="mt-1 text-2xl font-semibold">{currentExercises.length}</div></div>
                    <div className="rounded-2xl border border-slate-200 p-4 text-sm"><div className="text-slate-500">预计训练时长</div><div className="mt-1 text-2xl font-semibold">75–105 分钟</div></div>
                    <div className="rounded-2xl border border-slate-200 p-4 text-sm"><div className="text-slate-500">是否含有氧</div><div className="mt-1 text-2xl font-semibold">{hasCardio ? "有" : "无"}</div></div>
                    <div className="rounded-2xl border border-slate-200 p-4 text-sm"><div className="text-slate-500">阶段强度</div><div className="mt-1 text-2xl font-semibold">{weeklyProgression[weekNum - 1].intensity}</div></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button className="rounded-2xl" onClick={generateTodayPlan}><WandSparkles className="mr-2 h-4 w-4" /> 生成今日执行</Button>
                    <Button variant="outline" className="rounded-2xl" onClick={applyRecommendedMeals}>应用今日推荐饮食</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>今日快速执行卡</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div>训练：{split[dayNum - 1].title}</div>
                  <div>热量：{targetKcal} kcal 目标</div>
                  <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> 今日训练打卡</div>
                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                      {currentExercises.map((ex, idx) => (
                        <button key={idx} onClick={() => toggleExerciseCheck(idx, ex.name)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${exerciseChecks[idx] ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50"}`}>
                          <span className="pr-2">{ex.name}</span>
                          <span className="shrink-0 text-xs">{exerciseChecks[idx] ? "已完成" : "未完成"}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-600">训练完成度 = 已打卡动作数 / 今日总动作数，目前 {exerciseCountDone}</div>
                  </div>
                  <div>蛋白：至少 {profile.protein} g</div>
                  <div>步数：{profile.steps}</div>
                  <div>饮水：{profile.water}L</div>
                  <div>睡眠：{profile.sleep}h</div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Salad className="h-5 w-5" /> 当日饮食推荐</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><div className="font-medium">推荐逻辑</div><div className="mt-1">{recommendedMeals.reason}</div></div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {[["早餐", recommendedMeals.breakfast], ["午餐", recommendedMeals.lunch], ["训练前", recommendedMeals.pre], ["晚餐", recommendedMeals.dinner], ["加餐", recommendedMeals.snack]].map(([label, meal], idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                      <div className="flex items-center justify-between gap-2"><span className="text-slate-500">{label}</span><Button variant="outline" className="rounded-xl px-3 py-1 h-8" onClick={() => setSelectedMeal(meal)}><ChefHat className="h-4 w-4 mr-1" />做法</Button></div>
                      <div className="mt-1 font-medium">{meal.name}</div>
                      <div className="mt-2 text-xs text-slate-600">{meal.items}</div>
                      <div className="mt-3 text-xs text-slate-500">P {meal.protein} / C {meal.carbs} / F {meal.fat} / {meal.kcal} kcal</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">推荐总热量</div><div className="mt-1 text-2xl font-semibold">{recommendedMealTotals.kcal}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">推荐蛋白</div><div className="mt-1 text-2xl font-semibold">{recommendedMealTotals.protein}g</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">推荐碳水</div><div className="mt-1 text-2xl font-semibold">{recommendedMealTotals.carbs}g</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">推荐脂肪</div><div className="mt-1 text-2xl font-semibold">{recommendedMealTotals.fat}g</div></div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> 当周推荐购买食材</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><div className="font-medium">本周采购逻辑</div><div className="mt-1">{weeklyGroceryPlan.phaseNote}</div><div className="mt-2 text-xs text-slate-500">你现在看到的是“整周直接照买版”，不是开放式推荐列表。</div></div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">购物清单勾选</div>
                    <Badge variant="secondary">已购 {groceryDone}/{groceryTotal}</Badge>
                  </div>
                  <div className="mt-3"><Progress value={groceryProgress} /></div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {groceryItems.map((item, idx) => (
                      <button key={idx} onClick={() => toggleGrocery(item.name)} className={`flex items-center justify-between rounded-2xl border p-3 text-left text-sm ${groceryChecks[item.name] ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
                        <span className="pr-2">{item.name} · {item.qty}</span>
                        <span>{groceryChecks[item.name] ? "已购" : "未购"}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 font-medium">整周蛋白采购</div><div className="space-y-3 text-sm">{weeklyGroceryPlan.exactProtein.map((item, idx) => <div key={idx} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.name}</span><span className="text-slate-500">{item.qty}</span></div><div className="mt-1 text-xs text-slate-600">{item.why}</div></div>)}</div></div>
                  <div className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 font-medium">整周碳水与训练补给</div><div className="space-y-3 text-sm">{weeklyGroceryPlan.exactCarbs.map((item, idx) => <div key={idx} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.name}</span><span className="text-slate-500">{item.qty}</span></div><div className="mt-1 text-xs text-slate-600">{item.why}</div></div>)}</div></div>
                  <div className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 font-medium">整周蔬菜 / 脂肪 / 微量营养</div><div className="space-y-3 text-sm">{weeklyGroceryPlan.exactVegAndFats.map((item, idx) => <div key={idx} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.name}</span><span className="text-slate-500">{item.qty}</span></div><div className="mt-1 text-xs text-slate-600">{item.why}</div></div>)}</div></div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700"><div className="font-medium">本周备餐建议</div><ul className="mt-2 space-y-1 text-xs">{weeklyGroceryPlan.prepTips.map((tip, idx) => <li key={idx}>• {tip}</li>)}</ul><div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600">默认逻辑：这份清单已经尽量按你当前 7 天推荐饮食一次性买齐。你照着买，正常一周够用；如果你食量更大或想给家里人一起做，再在此基础上加 10%–20%。</div></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workout" className="space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5" /> 训练日明细</CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedWeek} onValueChange={setSelectedWeek}><SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{weeklyProgression.map((w) => <SelectItem key={w.week} value={String(w.week)}>第{w.week}周</SelectItem>)}</SelectContent></Select>
                    <Select value={selectedDay} onValueChange={setSelectedDay}><SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{split.map((d) => <SelectItem key={d.day} value={String(d.day)}>Day {d.day}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-lg font-medium">{split[dayNum - 1].title}</div>
                  <div className="mt-1 text-sm text-slate-600">第{weekNum}周 · {phaseMeta[phase].title}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">预计训练消耗 ≈ {trainingKcal} kcal</Badge>
                    <Badge variant="secondary">建议总时长 75–105 分钟</Badge>
                    <Badge variant="secondary">阶段强度：{weeklyProgression[weekNum - 1].intensity}</Badge>
                    <Badge variant="secondary">已打卡：{exerciseCountDone}</Badge>
                  </div>
                </div>
                <div className="grid gap-3">
                  {currentExercises.map((ex, idx) => (
                    <div key={idx} className={`rounded-2xl border bg-white p-4 ${exerciseChecks[idx] ? "border-slate-900" : "border-slate-200"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">{ex.name}</div>
                        <div className="flex gap-2">
                          <Badge variant="outline">≈ {ex.kcal} kcal</Badge>
                          <Button variant="outline" className="rounded-xl" onClick={() => setSelectedExercise(ex)}><BookOpen className="h-4 w-4 mr-1" />教学</Button>
                          <Button variant={exerciseChecks[idx] ? "default" : "outline"} className="rounded-xl" onClick={() => toggleExerciseCheck(idx, ex.name)}>{exerciseChecks[idx] ? "已完成" : "打卡"}</Button>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                        <div><span className="font-medium text-slate-800">器械/方式：</span>{ex.machine}</div>
                        <div><span className="font-medium text-slate-800">组数：</span>{ex.sets}</div>
                        <div><span className="font-medium text-slate-800">次数：</span>{ex.reps}</div>
                        <div><span className="font-medium text-slate-800">主要贡献：</span>{ex.muscles}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">说明：单项动作的 kcal 为粗略估算。力量训练更重要的意义是保肌与塑形，有氧更直接影响热量消耗。</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="food" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Salad className="h-5 w-5" /> 每日饮食搭配器</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(mealLibrary).map(([key, values]) => (
                    <div key={key} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-3 text-sm font-medium capitalize">{key === "breakfast" ? "早餐" : key === "lunch" ? "午餐" : key === "pre" ? "训练前" : key === "dinner" ? "晚餐" : "加餐"}</div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {values.map((m, idx) => (
                          <div key={idx} className={`rounded-2xl border p-3 transition ${mealSelection[key].name === m.name ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                            <div className="flex items-center justify-between gap-2"><div className="font-medium">{m.name}</div><Button variant="outline" className="rounded-xl px-3 py-1 h-8" onClick={() => setSelectedMeal(m)}><ChefHat className="h-4 w-4 mr-1" />做法</Button></div>
                            <div className="mt-1 text-xs text-slate-600">{m.items}</div>
                            <div className="mt-2 text-xs text-slate-500">P {m.protein} / C {m.carbs} / F {m.fat} / {m.kcal} kcal</div>
                            <Button variant={mealSelection[key].name === m.name ? "default" : "outline"} className="mt-3 rounded-xl" onClick={() => { setMealSelection((prev) => ({ ...prev, [key]: m })); showToast("饮食已选择", `${m.name} 已设置为当前${key === "breakfast" ? "早餐" : key === "lunch" ? "午餐" : key === "pre" ? "训练前" : key === "dinner" ? "晚餐" : "加餐"}`); }}>{mealSelection[key].name === m.name ? "已选" : "选择"}</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>当日营养汇总</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div><div className="mb-1 flex items-center justify-between"><span>热量</span><span>{mealTotals.kcal} / {targetKcal} kcal</span></div><Progress value={Math.min(100, (mealTotals.kcal / targetKcal) * 100)} /></div>
                  <div><div className="mb-1 flex items-center justify-between"><span>蛋白质</span><span>{mealTotals.protein} / {profile.protein} g</span></div><Progress value={Math.min(100, (mealTotals.protein / profile.protein) * 100)} /></div>
                  <div><div className="mb-1 flex items-center justify-between"><span>碳水</span><span>{mealTotals.carbs} / {targetCarbs} g</span></div><Progress value={Math.min(100, (mealTotals.carbs / targetCarbs) * 100)} /></div>
                  <div><div className="mb-1 flex items-center justify-between"><span>脂肪</span><span>{mealTotals.fat} / {profile.fat} g</span></div><Progress value={Math.min(100, (mealTotals.fat / profile.fat) * 100)} /></div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-slate-700"><div className="font-medium">建议</div><ul className="mt-2 space-y-1 text-xs"><li>训练日前后优先保证碳水和蛋白，避免空腹硬顶高强度。</li><li>体重两周不动时，先少加一点有氧或减100–150 kcal，不要猛砍饮食。</li><li>晚上饿可以优先补蛋白，不要用油炸和甜食填热量。</li></ul></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-4">
              <Card className="xl:col-span-2 rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> 总贡献面板</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {totalContribution.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 p-4"><div className="mb-1 flex items-center justify-between text-sm font-medium"><span>{item.label}</span><span>{item.value}%</span></div><Progress value={item.value} /><div className="mt-2 text-xs text-slate-500">{item.desc}</div></div>
                  ))}
                  <div className="grid gap-3 md:grid-cols-2">
                    {contribution.map((item, idx) => (
                      <div key={idx} className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="flex items-center justify-between"><span>{item.label}</span><span>{item.value}%</span></div><Progress value={item.value} /></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> 每日打卡</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  {[["cardioDone", "完成有氧"], ["foodDone", "饮食达标"], ["stepsDone", "达到步数"], ["waterDone", "饮水达标"], ["sleepDone", "睡眠达标"]].map(([key, label]) => (
                    <button key={key} onClick={() => toggleChecklist(key, label)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${checklist[key] ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
                      <span>{label}</span><span>{checklist[key] ? "已完成" : "未完成"}</span>
                    </button>
                  ))}
                  <div><div className="mb-1 flex items-center justify-between text-xs"><span>今日完成率</span><span>{executionScore}%</span></div><Progress value={executionScore} /></div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><FileBarChart2 className="h-5 w-5" /> 当日报表输入</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div><label className="mb-1 block text-xs text-slate-500">体重（kg）</label><input value={dailyLog.weight} onChange={(e) => setDailyLog((prev) => ({ ...prev, weight: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
                  <div><label className="mb-1 block text-xs text-slate-500">步数</label><input type="number" value={dailyLog.steps} onChange={(e) => setDailyLog((prev) => ({ ...prev, steps: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="mb-1 block text-xs text-slate-500">饮水（L）</label><input type="number" step="0.1" value={dailyLog.water} onChange={(e) => setDailyLog((prev) => ({ ...prev, water: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
                    <div><label className="mb-1 block text-xs text-slate-500">睡眠（h）</label><input type="number" step="0.1" value={dailyLog.sleep} onChange={(e) => setDailyLog((prev) => ({ ...prev, sleep: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
                  </div>
                  <div><label className="mb-1 block text-xs text-slate-500">主观状态（1–10）</label><input type="number" min="1" max="10" value={dailyLog.energy} onChange={(e) => setDailyLog((prev) => ({ ...prev, energy: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
                  <div><label className="mb-1 block text-xs text-slate-500">备注</label><textarea value={dailyLog.note} onChange={(e) => setDailyLog((prev) => ({ ...prev, note: e.target.value }))} className="min-h-[96px] w-full rounded-xl border border-slate-200 px-3 py-2" /></div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 rounded-2xl shadow-sm">
                <CardHeader><CardTitle>当日报表可视化</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">综合分</div><div className="mt-1 text-3xl font-semibold">{reportSummary.score}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">体重</div><div className="mt-1 text-3xl font-semibold">{dailyLog.weight} kg</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">步数</div><div className="mt-1 text-3xl font-semibold">{dailyLog.steps}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="text-slate-500">主观状态</div><div className="mt-1 text-3xl font-semibold">{dailyLog.energy}/10</div></div>
                  </div>
                  <div className="space-y-3">
                    <div><div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> 训练完成度</span><span>{workoutProgress}%</span></div><Progress value={workoutProgress} /><div className="mt-1 text-xs text-slate-500">按动作逐项打卡计算，做完一个勾一个，全部完成即 100%。</div></div>
                    <div><div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Flame className="h-4 w-4" /> 训练负荷参考</span><span>{workoutLoadReference}%</span></div><Progress value={workoutLoadReference} /><div className="mt-1 text-xs text-slate-500">这是今天这套计划本身的强度/消耗参考，不代表你已经完成了多少。</div></div>
                    <div><div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Salad className="h-4 w-4" /> 饮食推进条</span><span>{foodQuality}%</span></div><Progress value={foodQuality} /></div>
                    <div><div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Footprints className="h-4 w-4" /> 步数/有氧执行</span><span>{checklist.stepsDone || checklist.cardioDone ? 100 : 35}%</span></div><Progress value={checklist.stepsDone || checklist.cardioDone ? 100 : 35} /></div>
                    <div><div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Droplets className="h-4 w-4" /> 饮水恢复</span><span>{clamp((dailyLog.water / profile.water) * 100)}%</span></div><Progress value={clamp((dailyLog.water / profile.water) * 100)} /></div>
                    <div><div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2"><MoonStar className="h-4 w-4" /> 睡眠恢复</span><span>{clamp((dailyLog.sleep / profile.sleep) * 100)}%</span></div><Progress value={clamp((dailyLog.sleep / profile.sleep) * 100)} /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle>今日结论</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="font-medium">状态判断</div><div className="mt-1">{reportSummary.status}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="font-medium">今日重点</div><div className="mt-1">{reportSummary.highlight}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="font-medium">备注</div><div className="mt-1">{dailyLog.note}</div></div>
                  <Button className="w-full rounded-2xl" onClick={saveDailyReport}>生成今日执行报告</Button>
                </CardContent>
              </Card>
            </div>
            <Card className="rounded-2xl shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> 使用建议</CardTitle></CardHeader>
              <CardContent className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">现在它已经不只是计划页，而是“今日推荐 → 执行 → 打卡 → 报表”的闭环。</div>
                <div className="rounded-2xl bg-slate-50 p-4">历史日报列表和每周趋势图已经加进来，你能开始看执行是否越来越稳。</div>
                <div className="rounded-2xl bg-slate-50 p-4">动作和菜谱都可以点进去看教学/做法，执行阻力会更低。</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> 历史日报列表</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium">第{item.week}周 · Day {item.day} · {item.date}</div><Badge variant="outline">{item.workoutStatus}</Badge></div>
                      <div className="mt-2 grid gap-2 text-slate-600 md:grid-cols-5">
                        <div>综合分：<span className="font-medium text-slate-900">{item.score}</span></div>
                        <div>体重：<span className="font-medium text-slate-900">{item.weight} kg</span></div>
                        <div>步数：<span className="font-medium text-slate-900">{item.steps}</span></div>
                        <div>蛋白：<span className="font-medium text-slate-900">{item.protein} g</span></div>
                        <div>睡眠：<span className="font-medium text-slate-900">{item.sleep} h</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> 本周趋势概览</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div><div className="mb-1 flex items-center justify-between"><span>平均综合分</span><span>{weeklyTrend.score}</span></div><Progress value={weeklyTrend.score} /></div>
                  <div><div className="mb-1 flex items-center justify-between"><span>平均步数</span><span>{weeklyTrend.steps}</span></div><Progress value={clamp((weeklyTrend.steps / 12000) * 100)} /></div>
                  <div><div className="mb-1 flex items-center justify-between"><span>平均蛋白</span><span>{weeklyTrend.protein} g</span></div><Progress value={clamp((weeklyTrend.protein / profile.protein) * 100)} /></div>
                  <div><div className="mb-1 flex items-center justify-between"><span>平均睡眠</span><span>{weeklyTrend.sleep} h</span></div><Progress value={clamp((weeklyTrend.sleep / profile.sleep) * 100)} /></div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-slate-700"><div className="font-medium">怎么看</div><div className="mt-1 text-xs">这里已经加入真折线图。平均值面板用来看本周总体，折线图用来看每天波动。</div></div>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl shadow-sm"><CardHeader><CardTitle>综合分趋势</CardTitle></CardHeader><CardContent><MiniTrendChart data={trendData} dataKey="score" name="综合分" /></CardContent></Card>
              <Card className="rounded-2xl shadow-sm"><CardHeader><CardTitle>体重趋势</CardTitle></CardHeader><CardContent><MiniTrendChart data={trendData} dataKey="weight" name="体重" /></CardContent></Card>
              <Card className="rounded-2xl shadow-sm"><CardHeader><CardTitle>步数趋势</CardTitle></CardHeader><CardContent><MiniTrendChart data={trendData} dataKey="steps" name="步数" /></CardContent></Card>
              <Card className="rounded-2xl shadow-sm"><CardHeader><CardTitle>蛋白趋势</CardTitle></CardHeader><CardContent><MiniTrendChart data={trendData} dataKey="protein" name="蛋白" /></CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> {selectedExercise.name} 教学与要领</DialogTitle>
                <DialogDescription>{selectedExercise.machine} · {selectedExercise.sets} · {selectedExercise.reps}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">怎么练到位</div><div className="mt-1">{selectedExercise.cue}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">练到位的感觉</div><div className="mt-1">{selectedExercise.fit}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">常见错误</div><div className="mt-1">{selectedExercise.mistakes}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">动作步骤</div><ol className="mt-2 space-y-1 list-decimal pl-5">{selectedExercise.steps.map((step, idx) => <li key={idx}>{step}</li>)}</ol></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {selectedMeal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ChefHat className="h-5 w-5" /> {selectedMeal.name} 做法</DialogTitle>
                <DialogDescription>{selectedMeal.items}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">制作步骤</div><ol className="mt-2 space-y-1 list-decimal pl-5">{selectedMeal.recipe.map((step, idx) => <li key={idx}>{step}</li>)}</ol></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">制作要点</div><div className="mt-1">{selectedMeal.tips}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="font-medium">营养信息</div><div className="mt-1">蛋白 {selectedMeal.protein}g / 碳水 {selectedMeal.carbs}g / 脂肪 {selectedMeal.fat}g / 热量 {selectedMeal.kcal} kcal</div></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SuccessToast toast={toast} />
    </div>
  );
}

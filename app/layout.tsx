import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Cornelius 个人升级中控台",
  description: "把项目、学习、社交、行为、外表和内在复盘接成一个长期复利的个人操作系统。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

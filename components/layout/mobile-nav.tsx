"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

const mobileItems = ["/", "/today", "/stocks", "/learning", "/history"];

export function MobileNav() {
  const pathname = usePathname();
  const items = appNavItems.filter((item) => mobileItems.includes(item.href));

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 rounded-[24px] border border-white/60 bg-white/90 p-2 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center rounded-2xl px-2 py-1 text-[11px] font-medium transition",
                active ? "bg-pine text-white" : "text-ink/70",
              )}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

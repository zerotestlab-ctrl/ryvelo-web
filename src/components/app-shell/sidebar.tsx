"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutGrid,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { RyveloLogo } from "@/components/brand/ryvelo-logo";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/resolutions", label: "Resolutions", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-[264px] flex-col border-r border-border bg-[#071e34]">
      <div className="flex h-14 items-center px-3">
        <RyveloLogo href="/dashboard" tagline="Operations" />
      </div>
      <Separator className="bg-border/70" />

      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/5",
                active && "bg-white/7 text-foreground ring-1 ring-white/10"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 text-muted-foreground group-hover:text-foreground",
                  active && "text-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 pt-2">
        <div className="rounded-lg border border-border/70 bg-black/10 p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Environment
          </div>
          <div className="mt-1 text-sm text-foreground">Production</div>
        </div>
      </div>
    </aside>
  );
}


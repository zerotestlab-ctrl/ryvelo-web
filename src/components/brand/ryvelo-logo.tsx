import Link from "next/link";
import { DollarSign, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

/** Brand teal (matches product accent / Paystack-style CTAs). */
const BRAND_TEAL = "#00D4C8";
const BRAND_NAVY = "#0A2540";

type RyveloLogoProps = {
  /** Marketing home (`/`) or app home (`/dashboard`). */
  href?: string;
  /** Second line under the wordmark (e.g. sidebar). */
  tagline?: string;
  className?: string;
  /** Smaller icon + text for dense toolbars. */
  compact?: boolean;
};

/**
 * Ryvelo wordmark: **FileText + DollarSign** on navy — used on marketing + app shell.
 */
export function RyveloLogo({
  href = "/",
  tagline,
  className,
  compact = false,
}: RyveloLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-offset-background transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <span
        className={cn(
          "flex shrink-0 flex-row items-center justify-center rounded-lg shadow-sm ring-1 ring-[#00D4C8]/25",
          compact ? "h-8 gap-0 px-0.5" : "h-9 min-w-[2.25rem] gap-px px-1"
        )}
        style={{ backgroundColor: BRAND_NAVY }}
        aria-hidden
      >
        <FileText
          className={cn(compact ? "h-3 w-3" : "h-[15px] w-[15px]")}
          style={{ color: BRAND_TEAL }}
          strokeWidth={2.25}
        />
        <DollarSign
          className={cn(compact ? "h-3 w-3" : "h-[15px] w-[15px]")}
          style={{ color: BRAND_TEAL }}
          strokeWidth={2.25}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block font-semibold tracking-tight text-foreground",
            compact ? "text-sm" : "text-[15px] sm:text-base"
          )}
        >
          Ryvelo
        </span>
        {tagline ? (
          <span className="block truncate text-xs text-muted-foreground">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
